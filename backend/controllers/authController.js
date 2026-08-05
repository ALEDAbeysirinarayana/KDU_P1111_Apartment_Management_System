const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendRegistrationEmail, sendAdminApprovalEmail, sendOwnerApprovalEmail } = require('../utils/emailService');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_12345_apartment_system';

// @desc    Register a new user (Homeowner or Tenant)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { 
    email, 
    password, 
    role, 
    fullName, 
    nicOrPassport, 
    phoneNumber, 
    buildingName, 
    unitNumber, 
    vehicleNumber, 
    ownerEmail, 
    relationshipToOwner 
  } = req.body;

  try {
    // 1. Basic validation
    if (!email || !password || !role || !fullName || !nicOrPassport || !phoneNumber || !buildingName || !unitNumber) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // 2. Prevent public registration of admin, staff, maintenance roles
    if (!['homeowner', 'tenant'].includes(role)) {
      return res.status(400).json({ message: 'Public registration is only allowed for homeowners and tenants.' });
    }

    // 3. Check if email already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // 4. Validate tenant-specific details (must select/provide homeowner email)
    let finalOwnerId = null;
    if (role === 'tenant') {
      if (!ownerEmail) {
        return res.status(400).json({ message: 'Tenants must specify the homeowner\'s email.' });
      }
      if (!relationshipToOwner) {
        return res.status(400).json({ message: 'Tenants must specify their relationship to the homeowner.' });
      }

      const [homeowner] = await pool.query(
        'SELECT id, role, status FROM users WHERE email = ?',
        [ownerEmail]
      );

      if (homeowner.length === 0 || homeowner[0].role !== 'homeowner' || homeowner[0].status !== 'approved') {
        return res.status(400).json({ message: 'No approved homeowner found with the specified email.' });
      }
      finalOwnerId = homeowner[0].id;
    }

    // 5. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Insert user with new columns
    // owner_approved starts as 0 (it is only meaningful for tenants)
    const [result] = await pool.query(
      `INSERT INTO users (
        email, password_hash, role, status, owner_id, owner_approved,
        full_name, nic_or_passport, phone_number, building_name, unit_number, vehicle_number, relationship_to_owner
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email, passwordHash, role, 'pending', finalOwnerId, 0,
        fullName, nicOrPassport, phoneNumber, buildingName, unitNumber, vehicleNumber || null, relationshipToOwner || null
      ]
    );

    // Send registration confirmation email (fire-and-forget)
    sendRegistrationEmail({ email, fullName, role }).catch((err) =>
      console.error('[Email] Registration email failed:', err.message)
    );

    return res.status(201).json({
      message: 'Registration successful. Your account is pending approval.',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Log in a user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // 1. Fetch user by email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = users[0];

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. CRITICAL LOGIN LOGIC: check status
    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your registration is pending approval.' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your registration has been rejected.' });
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, sub_role: user.sub_role || null, full_name: user.full_name || null },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        sub_role: user.sub_role || null,
        full_name: user.full_name || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get pending approvals (Admin or Homeowner)
// @route   GET /api/auth/pending-approvals
// @access  Private (Admin / Homeowner)
const getPendingApprovals = async (req, res) => {
  const { role, id: userId } = req.user;

  try {
    if (role === 'admin' || role === 'staff') {
      // Admin/Staff sees pending homeowners and pending tenants that are already homeowner-approved
      const [pendingHomeowners] = await pool.query(
        `SELECT id, email, role, status, created_at, 
                full_name, nic_or_passport, phone_number, building_name, unit_number, vehicle_number
         FROM users 
         WHERE role = "homeowner" AND status = "pending"`
      );

      const [pendingTenants] = await pool.query(
        `SELECT t.id, t.email, t.role, t.status, t.created_at, o.email AS owner_email,
                t.full_name, t.nic_or_passport, t.phone_number, t.building_name, t.unit_number, t.vehicle_number, t.relationship_to_owner
         FROM users t 
         JOIN users o ON t.owner_id = o.id 
         WHERE t.role = "tenant" AND t.status = "pending" AND t.owner_approved = 1`
      );

      return res.status(200).json({
        homeowners: pendingHomeowners,
        tenants: pendingTenants
      });
    } else if (role === 'homeowner') {
      // Homeowner sees pending tenants linked to them who haven't received homeowner approval yet
      const [pendingTenants] = await pool.query(
        `SELECT id, email, role, status, created_at,
                full_name, nic_or_passport, phone_number, building_name, unit_number, vehicle_number, relationship_to_owner
         FROM users 
         WHERE role = "tenant" AND owner_id = ? AND status = "pending" AND owner_approved = 0`,
        [userId]
      );

      return res.status(200).json({ tenants: pendingTenants });
    } else {
      return res.status(403).json({ message: 'Forbidden.' });
    }
  } catch (error) {
    console.error('Get pending approvals error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Approve or reject a user (Admin/Staff or Homeowner)
// @route   POST /api/auth/approve
// @access  Private (Admin / Staff / Homeowner)
const approveUser = async (req, res) => {
  const { userId, action } = req.body; // action: 'approve' or 'reject'
  const { role: requesterRole, id: requesterId } = req.user;

  try {
    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'User ID and valid action (approve/reject) are required.' });
    }

    // Fetch the target user details
    const [targetUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (targetUsers.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const targetUser = targetUsers[0];

    if (requesterRole === 'admin' || requesterRole === 'staff') {
      // Admin/Staff can approve homeowners directly
      if (targetUser.role === 'homeowner') {
        const finalStatus = action === 'approve' ? 'approved' : 'rejected';
        await pool.query('UPDATE users SET status = ? WHERE id = ?', [finalStatus, userId]);

        // Notify homeowner of admin decision (fire-and-forget)
        sendAdminApprovalEmail(targetUser, action).catch((err) =>
          console.error('[Email] Admin approval email failed:', err.message)
        );

        return res.status(200).json({ message: `Homeowner has been ${finalStatus}.` });
      }

      // Admin/Staff can approve tenants who have already been approved by their homeowner
      if (targetUser.role === 'tenant') {
        if (targetUser.owner_approved !== 1) {
          return res.status(400).json({ message: 'Tenant must be approved by their homeowner first.' });
        }
        const finalStatus = action === 'approve' ? 'approved' : 'rejected';
        await pool.query('UPDATE users SET status = ? WHERE id = ?', [finalStatus, userId]);

        // Notify tenant of admin decision (fire-and-forget)
        sendAdminApprovalEmail(targetUser, action).catch((err) =>
          console.error('[Email] Admin approval email failed:', err.message)
        );

        return res.status(200).json({ message: `Tenant has been ${finalStatus} by Admin.` });
      }

      return res.status(400).json({ message: 'Invalid role for approval.' });
    } else if (requesterRole === 'homeowner') {
      // Homeowner can only approve tenants who are linked to them
      if (targetUser.role !== 'tenant') {
        return res.status(403).json({ message: 'Homeowners can only approve tenants.' });
      }

      if (targetUser.owner_id !== requesterId) {
        return res.status(403).json({ message: 'This tenant is not registered under your unit.' });
      }

      if (action === 'approve') {
        await pool.query('UPDATE users SET owner_approved = 1 WHERE id = ?', [userId]);

        // Notify tenant that homeowner approved (fire-and-forget)
        sendOwnerApprovalEmail(targetUser, 'approve').catch((err) =>
          console.error('[Email] Homeowner approval email failed:', err.message)
        );

        return res.status(200).json({ message: 'Tenant approved by Homeowner. Now pending Admin approval.' });
      } else {
        await pool.query('UPDATE users SET status = "rejected" WHERE id = ?', [userId]);

        // Notify tenant that homeowner rejected (fire-and-forget)
        sendOwnerApprovalEmail(targetUser, 'reject').catch((err) =>
          console.error('[Email] Homeowner rejection email failed:', err.message)
        );

        return res.status(200).json({ message: 'Tenant request rejected by Homeowner.' });
      }
    } else {
      return res.status(403).json({ message: 'Forbidden. You do not have permission to perform this action.' });
    }
  } catch (error) {
    console.error('Approve user error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get all active homeowners (useful for Tenant registration dropdown)
// @route   GET /api/auth/homeowners
// @access  Public
const getApprovedHomeowners = async (req, res) => {
  try {
    const [homeowners] = await pool.query(
      'SELECT id, email FROM users WHERE role = "homeowner" AND status = "approved"'
    );
    return res.status(200).json(homeowners);
  } catch (error) {
    console.error('Get homeowners error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get available units grouped by building for public registration dropdown
// @route   GET /api/auth/available-units
// @access  Public
const getPublicAvailableUnits = async (req, res) => {
  try {
    const [units] = await pool.query(
      `SELECT id, block_name, floor_number, unit_number, type, status 
       FROM units 
       ORDER BY block_name ASC, floor_number ASC, unit_number ASC`
    );

    const blocks = Array.from(new Set(units.map(u => u.block_name))).filter(Boolean);

    return res.status(200).json({
      blocks: blocks.length > 0 ? blocks : ['Block A', 'Block B', 'Block C', 'Block D'],
      units
    });
  } catch (error) {
    console.error('Get available units error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get admin dashboard stats and metrics
// @route   GET /api/auth/admin-dashboard-stats
// @access  Private (Admin / Staff)
const getAdminDashboardStats = async (req, res) => {
  try {
    // 1. Total units
    const [totalUnitsRes] = await pool.query('SELECT COUNT(*) AS count FROM units');
    const totalUnits = totalUnitsRes[0]?.count || 0;

    // 2. Occupied units (owner or tenant allocated)
    const [occupiedUnitsRes] = await pool.query('SELECT COUNT(*) AS count FROM units WHERE owner_id IS NOT NULL OR tenant_id IS NOT NULL');
    const occupiedUnits = occupiedUnitsRes[0]?.count || 0;

    // 3. Total Residents (approved homeowners and tenants)
    const [totalResidentsRes] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role IN ('homeowner', 'tenant') AND status = 'approved'");
    const totalResidents = totalResidentsRes[0]?.count || 0;

    // 4. Pending user approvals (status pending for homeowners or tenants)
    const [pendingApprovalsRes] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role IN ('homeowner', 'tenant') AND status = 'pending'");
    const pendingUserApprovals = pendingApprovalsRes[0]?.count || 0;

    // 5. Active complaints (status pending or in progress)
    const [activeComplaintsRes] = await pool.query("SELECT COUNT(*) AS count FROM complaints WHERE status IN ('pending', 'in_progress')");
    const activeComplaints = activeComplaintsRes[0]?.count || 0;

    // 6. Emergency complaints (high priority and not resolved)
    const [emergencyComplaintsRes] = await pool.query("SELECT COUNT(*) AS count FROM complaints WHERE priority = 'high' AND status IN ('pending', 'in_progress')");
    const emergencyComplaints = emergencyComplaintsRes[0]?.count || 0;

    // 7. Pending facility bookings
    const [pendingBookingsRes] = await pool.query("SELECT COUNT(*) AS count FROM facility_reservations WHERE status = 'pending'");
    const pendingFacilityBookings = pendingBookingsRes[0]?.count || 0;

    // 8. Overdue payments (bills that are unpaid and due date has passed)
    const [overduePaymentsRes] = await pool.query("SELECT COUNT(*) AS count FROM bills WHERE status = 'unpaid' AND due_date < CURDATE()");
    const overduePayments = overduePaymentsRes[0]?.count || 0;

    // 9. Complaint status segments
    const [emergencyCountRes] = await pool.query("SELECT COUNT(*) AS count FROM complaints WHERE priority = 'high' AND status IN ('pending', 'in_progress')");
    const [pendingCountRes] = await pool.query("SELECT COUNT(*) AS count FROM complaints WHERE status = 'pending' AND priority != 'high'");
    const [inProgressCountRes] = await pool.query("SELECT COUNT(*) AS count FROM complaints WHERE status = 'in_progress' AND priority != 'high'");
    const [completedCountRes] = await pool.query("SELECT COUNT(*) AS count FROM complaints WHERE status = 'resolved'");

    const complaintStatus = {
      emergency: emergencyCountRes[0]?.count || 0,
      pending: pendingCountRes[0]?.count || 0,
      inProgress: inProgressCountRes[0]?.count || 0,
      completed: completedCountRes[0]?.count || 0
    };

    // 10. Facility booking status segments
    const [bookingApprovedRes] = await pool.query("SELECT COUNT(*) AS count FROM facility_reservations WHERE status = 'approved'");
    const [bookingPendingRes] = await pool.query("SELECT COUNT(*) AS count FROM facility_reservations WHERE status = 'pending'");
    const [bookingRejectedRes] = await pool.query("SELECT COUNT(*) AS count FROM facility_reservations WHERE status = 'rejected'");

    const bookingStatus = {
      approved: bookingApprovedRes[0]?.count || 0,
      pending: bookingPendingRes[0]?.count || 0,
      rejected: bookingRejectedRes[0]?.count || 0
    };

    // 11. Facility usage overview percentages
    const [poolBookings] = await pool.query("SELECT COUNT(*) AS count FROM facility_reservations WHERE facility_name = 'Swimming Pool Annex' AND status = 'approved'");
    const [clubBookings] = await pool.query("SELECT COUNT(*) AS count FROM facility_reservations WHERE facility_name = 'Clubhouse Hall' AND status = 'approved'");
    const [loungeBookings] = await pool.query("SELECT COUNT(*) AS count FROM facility_reservations WHERE facility_name = 'Rooftop Lounge' AND status = 'approved'");

    const facilityUsage = {
      swimmingPool: Math.min(95, 45 + (poolBookings[0]?.count || 0) * 8),
      gymnasium: Math.min(95, 62 + (loungeBookings[0]?.count || 0) * 3),
      clubhouse: Math.min(95, 30 + (clubBookings[0]?.count || 0) * 10)
    };

    // 12. Recent activities timeline log
    const [recentComplaints] = await pool.query(`
      SELECT c.id, c.category, c.status, c.created_at, u.full_name, u.building_name, u.unit_number 
      FROM complaints c 
      JOIN users u ON c.user_id = u.id 
      ORDER BY c.created_at DESC LIMIT 3
    `);

    const [recentRegistrations] = await pool.query(`
      SELECT id, email, role, created_at, status, full_name, building_name, unit_number 
      FROM users 
      WHERE role IN ('homeowner', 'tenant') 
      ORDER BY created_at DESC LIMIT 3
    `);

    const [recentBills] = await pool.query(`
      SELECT b.id, b.amount, b.description, b.status, b.created_at, u.block_name, u.unit_number 
      FROM bills b 
      JOIN units u ON b.unit_id = u.id 
      ORDER BY b.created_at DESC LIMIT 3
    `);

    const [recentNotices] = await pool.query(`
      SELECT n.id, n.title, n.created_at, u.email AS author_email 
      FROM notices n 
      JOIN users u ON n.created_by = u.id 
      ORDER BY n.created_at DESC LIMIT 3
    `);

    const activities = [];

    recentComplaints.forEach((c) => {
      activities.push({
        id: `complaint_${c.id}`,
        title: `Complaint #${c.id}`,
        message: `${c.category} reported in Unit ${c.building_name || 'Block'}-${c.unit_number || '?'}`,
        badge: c.status === 'pending' ? 'NEW' : c.status.toUpperCase(),
        badgeType: c.status === 'pending' ? 'urgent' : c.status === 'in_progress' ? 'info' : 'success',
        created_at: c.created_at
      });
    });

    recentRegistrations.forEach((r) => {
      activities.push({
        id: `reg_${r.id}`,
        title: `New Resident`,
        message: `${r.full_name || r.email} applied for Unit ${r.building_name || 'Block'}-${r.unit_number || '?'}`,
        badge: r.status === 'pending' ? 'APPROVAL' : 'SUCCESS',
        badgeType: r.status === 'pending' ? 'info' : 'success',
        created_at: r.created_at
      });
    });

    recentBills.forEach((b) => {
      activities.push({
        id: `bill_${b.id}`,
        title: b.status === 'paid' ? 'Invoice Paid' : 'Invoice Generated',
        message: `${b.description} paid for Unit ${b.block_name}-${b.unit_number}`,
        badge: b.status === 'paid' ? 'SUCCESS' : 'PENDING',
        badgeType: b.status === 'paid' ? 'success' : 'info',
        created_at: b.created_at
      });
    });

    recentNotices.forEach((n) => {
      activities.push({
        id: `notice_${n.id}`,
        title: `Notice Board`,
        message: `${n.title} published by Admin`,
        badge: 'SYSTEM',
        badgeType: 'system',
        created_at: n.created_at
      });
    });

    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({
      metrics: {
        totalUnits,
        occupiedUnits,
        totalResidents,
        pendingUserApprovals,
        activeComplaints,
        emergencyComplaints,
        pendingFacilityBookings,
        overduePayments
      },
      complaintStatus,
      bookingStatus,
      facilityUsage,
      activities: activities.slice(0, 5)
    });
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get residents with filters, pagination, and payment clearances
// @route   GET /api/auth/residents
// @access  Private (Admin / Staff)
const getApprovedResidents = async (req, res) => {
  const { role: requesterRole } = req.user;
  if (requesterRole !== 'admin' && requesterRole !== 'staff') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  try {
    const { status, block, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['role IN ("homeowner", "tenant")'];
    let params = [];

    if (status && status !== 'All' && status !== '') {
      conditions.push('status = ?');
      params.push(status.toLowerCase());
    }

    if (block && block !== 'All' && block !== '') {
      conditions.push('building_name = ?');
      params.push(block);
    }

    if (search && search.trim() !== '') {
      conditions.push('(full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Calculate total matches for pagination
    const countQuery = `SELECT COUNT(*) AS count FROM users ${whereClause}`;
    const [countRes] = await pool.query(countQuery, params);
    const totalMatch = countRes[0]?.count || 0;

    // Fetch residents along with dynamic calculation of their unpaid bills sum
    const selectQuery = `
      SELECT 
        u.id, u.email, u.role, u.status, u.created_at,
        u.full_name, u.nic_or_passport, u.phone_number, u.building_name, u.unit_number, u.vehicle_number,
        COALESCE(
          (SELECT SUM(b.amount) 
           FROM bills b 
           JOIN units un ON b.unit_id = un.id 
           WHERE (un.owner_id = u.id OR un.tenant_id = u.id) AND b.status = 'unpaid'),
          0
        ) AS outstanding_amount
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [residents] = await pool.query(selectQuery, [...params, parseInt(limit), parseInt(offset)]);

    // Calculate metrics for summary cards
    const [metricsRes] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS vacated,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS new_residents
      FROM users
      WHERE role IN ('homeowner', 'tenant')
    `);

    const summaryMetrics = {
      total: metricsRes[0]?.total || 0,
      active: metricsRes[0]?.active || 0,
      vacated: metricsRes[0]?.vacated || 0,
      new_residents: metricsRes[0]?.new_residents || 0
    };

    return res.status(200).json({
      residents,
      total: totalMatch,
      metrics: summaryMetrics
    });
  } catch (error) {
    console.error('Get residents error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get resident dashboard stats and metrics
// @route   GET /api/auth/resident-dashboard-stats
// @access  Private (Homeowner / Tenant)
const getResidentDashboardStats = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Pending complaints count
    const [pendingComplaintsRes] = await pool.query(
      "SELECT COUNT(*) AS count FROM complaints WHERE user_id = ? AND status IN ('pending', 'in_progress')",
      [userId]
    );
    const pendingComplaints = pendingComplaintsRes[0]?.count || 0;

    // 2. Urgent complaints count
    const [urgentComplaintsRes] = await pool.query(
      "SELECT COUNT(*) AS count FROM complaints WHERE user_id = ? AND priority = 'high' AND status IN ('pending', 'in_progress')",
      [userId]
    );
    const urgentComplaints = urgentComplaintsRes[0]?.count || 0;

    // 3. Upcoming bookings count
    const [upcomingBookingsRes] = await pool.query(
      "SELECT COUNT(*) AS count FROM facility_reservations WHERE user_id = ? AND status = 'approved' AND date >= CURDATE()",
      [userId]
    );
    const upcomingBookings = upcomingBookingsRes[0]?.count || 0;

    // 4. Next booking details
    const [nextBookingRes] = await pool.query(
      "SELECT facility_name, date FROM facility_reservations WHERE user_id = ? AND status = 'approved' AND date >= CURDATE() ORDER BY date ASC LIMIT 1",
      [userId]
    );
    const nextBooking = nextBookingRes[0] || null;

    // 5. Pending payments sum
    const [pendingPaymentsRes] = await pool.query(
      `SELECT SUM(b.amount) AS total FROM bills b 
       JOIN units u ON b.unit_id = u.id 
       WHERE (u.owner_id = ? OR u.tenant_id = ?) AND b.status = 'unpaid'`,
      [userId, userId]
    );
    const pendingPayments = pendingPaymentsRes[0]?.total || 0;

    // 6. Next payment due date
    const [nextPaymentDueRes] = await pool.query(
      `SELECT b.due_date FROM bills b 
       JOIN units u ON b.unit_id = u.id 
       WHERE (u.owner_id = ? OR u.tenant_id = ?) AND b.status = 'unpaid' 
       ORDER BY b.due_date ASC LIMIT 1`,
      [userId, userId]
    );
    const nextPaymentDue = nextPaymentDueRes[0]?.due_date || null;

    // 7. Active notices count
    const [activeNoticesRes] = await pool.query("SELECT COUNT(*) AS count FROM notices");
    const activeNotices = activeNoticesRes[0]?.count || 0;

    // 8. Latest notices (3)
    const [latestNotices] = await pool.query(
      `SELECT n.*, u.email AS author_email FROM notices n 
       JOIN users u ON n.created_by = u.id 
       ORDER BY n.created_at DESC LIMIT 3`
    );

    // 9. My complaints (3)
    const [myComplaints] = await pool.query(
      "SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC LIMIT 3",
      [userId]
    );

    // 10. My bills (5)
    const [myBills] = await pool.query(
      `SELECT b.*, u.block_name, u.unit_number FROM bills b 
       JOIN units u ON b.unit_id = u.id 
       WHERE (u.owner_id = ? OR u.tenant_id = ?) 
       ORDER BY b.due_date DESC LIMIT 5`,
      [userId, userId]
    );

    // 11. Compile timeline activities
    const [userComplaints] = await pool.query(
      "SELECT id, category, created_at, status FROM complaints WHERE user_id = ? ORDER BY created_at DESC LIMIT 3",
      [userId]
    );

    const [userBookings] = await pool.query(
      "SELECT id, facility_name, date, status, created_at FROM facility_reservations WHERE user_id = ? ORDER BY created_at DESC LIMIT 3",
      [userId]
    );

    const [userPayments] = await pool.query(
      `SELECT b.id, b.amount, b.description, b.status, b.created_at FROM bills b 
       JOIN units u ON b.unit_id = u.id 
       WHERE (u.owner_id = ? OR u.tenant_id = ?) 
       ORDER BY b.created_at DESC LIMIT 3`,
      [userId, userId]
    );

    const activities = [];

    userComplaints.forEach((c) => {
      activities.push({
        id: `complaint_${c.id}`,
        title: 'Complaint submitted',
        message: `${c.category} request submitted (Status: ${c.status})`,
        created_at: c.created_at,
        type: 'complaint'
      });
    });

    userBookings.forEach((b) => {
      activities.push({
        id: `booking_${b.id}`,
        title: b.status === 'approved' ? 'Booking confirmed' : 'Booking requested',
        message: `${b.facility_name} reserved for ${new Date(b.date).toLocaleDateString()} (${b.status})`,
        created_at: b.created_at,
        type: 'booking'
      });
    });

    userPayments.forEach((p) => {
      activities.push({
        id: `payment_${p.id}`,
        title: p.status === 'paid' ? 'Invoice paid' : 'Invoice generated',
        message: `${p.description} - $${p.amount} (${p.status})`,
        created_at: p.created_at,
        type: 'payment'
      });
    });

    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({
      metrics: {
        pendingComplaints,
        urgentComplaints,
        upcomingBookings,
        pendingPayments,
        activeNotices,
        nextBooking,
        nextPaymentDue
      },
      latestNotices,
      myComplaints,
      myBills,
      activities: activities.slice(0, 5)
    });
  } catch (error) {
    console.error('Get resident dashboard stats error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Update resident profile details
// @route   PUT /api/auth/profile
// @access  Private (All Roles)
const updateProfile = async (req, res) => {
  const { full_name, phone_number, vehicle_number } = req.body;
  const userId = req.user.id;

  try {
    await pool.query(
      'UPDATE users SET full_name = ?, phone_number = ?, vehicle_number = ? WHERE id = ?',
      [full_name || null, phone_number || null, vehicle_number || null, userId]
    );

    return res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get all users (filtered and paginated)
// @route   GET /api/auth/users
// @access  Private (Admin / Staff)
const getAllUsers = async (req, res) => {
  const { role: requesterRole } = req.user;
  if (requesterRole !== 'admin' && requesterRole !== 'staff') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];

    if (role && role !== 'All' && role !== '') {
      conditions.push('role = ?');
      params.push(role.toLowerCase());
    }

    if (status && status !== 'All' && status !== '') {
      let mappedStatus = status.toLowerCase();
      if (mappedStatus === 'active') mappedStatus = 'approved';
      conditions.push('status = ?');
      params.push(mappedStatus);
    }

    if (search && search.trim() !== '') {
      conditions.push('(full_name LIKE ? OR email LIKE ? OR unit_number LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matches
    const countQuery = `SELECT COUNT(*) AS count FROM users ${whereClause}`;
    const [countRes] = await pool.query(countQuery, params);
    const totalMatch = countRes[0]?.count || 0;

    // Fetch users
    const selectQuery = `
      SELECT id, email, role, sub_role, status, created_at, full_name, nic_or_passport, phone_number, building_name, unit_number, vehicle_number 
      FROM users 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const [users] = await pool.query(selectQuery, [...params, parseInt(limit), parseInt(offset)]);

    // Calculate overall system-wide metrics for the header cards
    const [metricsRes] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended
      FROM users
    `);
    const systemMetrics = {
      total: metricsRes[0]?.total || 0,
      active: metricsRes[0]?.active || 0,
      pending: metricsRes[0]?.pending || 0,
      suspended: metricsRes[0]?.suspended || 0
    };

    return res.status(200).json({
      users,
      total: totalMatch,
      metrics: systemMetrics
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Admin direct create user
// @route   POST /api/auth/users
// @access  Private (Admin only)
const adminCreateUser = async (req, res) => {
  const { role: requesterRole } = req.user;
  if (requesterRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  const { email, password, role, status, full_name, phone_number, building_name, unit_number, vehicle_number, sub_role } = req.body;

  try {
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required.' });
    }

    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userStatus = status || 'approved'; // Default to active/approved for admin creation

    await pool.query(
      `INSERT INTO users (email, password_hash, role, sub_role, status, full_name, phone_number, building_name, unit_number, vehicle_number) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, role, (role === 'staff' ? (sub_role || null) : null), userStatus, full_name || null, phone_number || null, building_name || null, unit_number || null, vehicle_number || null]
    );

    return res.status(201).json({ message: 'User created successfully.' });
  } catch (error) {
    console.error('Admin create user error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Update user status (Approve, Suspend, etc.)
// @route   PUT /api/auth/users/:id/status
// @access  Private (Admin / Staff)
const updateUserStatus = async (req, res) => {
  const { role: requesterRole } = req.user;
  if (requesterRole !== 'admin' && requesterRole !== 'staff') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!status || !['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required.' });
    }

    const [target] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (target.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    return res.status(200).json({ message: `User status updated to ${status}.` });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  const { role: requesterRole } = req.user;
  if (requesterRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  const { id } = req.params;

  try {
    const [target] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (target.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Admin edit/update user details
// @route   PUT /api/auth/users/:id
// @access  Private (Admin / Staff)
const adminUpdateUser = async (req, res) => {
  const { role: requesterRole } = req.user;
  if (requesterRole !== 'admin' && requesterRole !== 'staff') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { id } = req.params;
  const { 
    full_name, 
    email, 
    role, 
    status, 
    building_name, 
    unit_number, 
    phone_number, 
    vehicle_number, 
    nic_or_passport,
    sub_role
  } = req.body;

  try {
    const [target] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (target.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (email) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email address is already in use.' });
      }
    }

    await pool.query(
      `UPDATE users SET 
        full_name = ?, 
        email = COALESCE(?, email), 
        role = COALESCE(?, role), 
        sub_role = ?,
        status = COALESCE(?, status), 
        building_name = ?, 
        unit_number = ?, 
        phone_number = ?, 
        vehicle_number = ?, 
        nic_or_passport = ? 
       WHERE id = ?`,
      [
        full_name !== undefined ? full_name : null,
        email || null,
        role || null,
        sub_role !== undefined ? (sub_role || null) : null,
        status || null,
        building_name !== undefined ? building_name : null,
        unit_number !== undefined ? unit_number : null,
        phone_number !== undefined ? phone_number : null,
        vehicle_number !== undefined ? vehicle_number : null,
        nic_or_passport !== undefined ? nic_or_passport : null,
        id
      ]
    );

    return res.status(200).json({ message: 'User details updated successfully.' });
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Retrieve list of seed accounts with test credentials
// @route   GET /api/auth/credentials
// @access  Public
const getTestCredentials = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, email, role, status, full_name, building_name, unit_number, phone_number, nic_or_passport, vehicle_number, relationship_to_owner
       FROM users
       ORDER BY FIELD(role, 'admin', 'staff', 'maintenance', 'homeowner', 'tenant'), email ASC`
    );

    // Map default passwords based on role/email
    const defaultPasswords = {
      'admin@apartment.com': 'AdminPass123!',
      'staff@apartment.com': 'StaffPass123!',
      'maintenance@apartment.com': 'MaintenancePass123!',
      'homeowner@apartment.com': 'OwnerPass123!'
    };

    const formattedUsers = users.map(u => {
      let pass = defaultPasswords[u.email];
      if (!pass) {
        if (u.role === 'admin') pass = 'AdminPass123!';
        else if (u.role === 'staff') pass = 'StaffPass123!';
        else if (u.role === 'maintenance') pass = 'MaintenancePass123!';
        else if (u.role === 'homeowner') pass = 'OwnerPass123!';
        else if (u.role === 'tenant') pass = 'TenantPass123!';
        else pass = 'Pass123!';
      }
      return {
        ...u,
        default_password: pass
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedUsers.length,
      credentials: formattedUsers
    });
  } catch (error) {
    console.error('Get test credentials error:', error);
    return res.status(500).json({ message: 'Failed to retrieve test credentials.' });
  }
};

module.exports = {
  register,
  login,
  getPendingApprovals,
  approveUser,
  getApprovedHomeowners,
  getAdminDashboardStats,
  getApprovedResidents,
  getResidentDashboardStats,
  updateProfile,
  getAllUsers,
  adminCreateUser,
  updateUserStatus,
  deleteUser,
  adminUpdateUser,
  getPublicAvailableUnits,
  getTestCredentials
};

