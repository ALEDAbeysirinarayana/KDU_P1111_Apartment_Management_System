const pool = require('../config/db');

// @desc    Submit a complaint
// @route   POST /api/complaints
// @access  Private (Homeowner / Tenant)
const submitComplaint = async (req, res) => {
  const { category, description, priority } = req.body;
  const userId = req.user.id;

  try {
    if (!category || !description || !priority) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority level.' });
    }

    const [result] = await pool.query(
      'INSERT INTO complaints (user_id, category, description, priority, status) VALUES (?, ?, ?, ?, ?)',
      [userId, category, description, priority, 'pending']
    );

    return res.status(201).json({
      message: 'Complaint submitted successfully.',
      complaintId: result.insertId
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get complaints based on user role and filters
// @route   GET /api/complaints
// @access  Private (All Roles)
const getComplaints = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    const { status, category, priority, block, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];

    if (role === 'maintenance') {
      // Limit to tickets assigned to them or unassigned
      conditions.push('(c.assigned_staff_id = ? OR c.assigned_staff_id IS NULL)');
      params.push(userId);
    } else if (role !== 'admin' && role !== 'staff') {
      // Homeowners/Tenants only see their own tickets
      conditions.push('c.user_id = ?');
      params.push(userId);
    }

    // Apply Filter Criteria
    if (status && status !== 'All' && status !== 'Status: All') {
      conditions.push('c.status = ?');
      params.push(status.toLowerCase());
    }

    if (category && category !== 'All' && category !== 'Category: All') {
      conditions.push('c.category = ?');
      params.push(category);
    }

    if (priority && priority !== 'All' && priority !== 'Priority: All') {
      conditions.push('c.priority = ?');
      params.push(priority.toLowerCase());
    }

    if (block && block !== 'All' && block !== 'Block: All') {
      conditions.push('u.building_name = ?');
      params.push(block);
    }

    if (search && search.trim() !== '') {
      conditions.push('(c.description LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR u.unit_number LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Calculate total matching records
    const countQuery = `
      SELECT COUNT(*) AS count 
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      ${whereClause}
    `;
    const [countRes] = await pool.query(countQuery, params);
    const totalMatch = countRes[0]?.count || 0;

    // Fetch complaints
    const selectQuery = `
      SELECT 
        c.*, 
        u.email AS resident_email, 
        u.full_name AS resident_name, 
        u.building_name AS resident_building, 
        u.unit_number AS resident_unit,
        staff.email AS assigned_staff_email, 
        staff.full_name AS assigned_staff_name
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users staff ON c.assigned_staff_id = staff.id
      ${whereClause}
      ORDER BY 
        CASE c.priority 
          WHEN 'emergency' THEN 1
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END ASC, 
        c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [complaints] = await pool.query(selectQuery, [...params, parseInt(limit), parseInt(offset)]);

    // Calculate Metrics for summary cards
    const [[complaintMetrics]] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN status = 'emergency' OR priority = 'emergency' THEN 1 ELSE 0 END) AS emergency
      FROM complaints
    `);

    // Calculate staff workloads
    const [staffWorkload] = await pool.query(`
      SELECT 
        u.id, 
        u.full_name AS staff_name, 
        u.email AS staff_email,
        u.role,
        SUM(CASE WHEN c.status IN ('pending', 'in_progress', 'emergency') THEN 1 ELSE 0 END) AS active_tickets
      FROM users u
      LEFT JOIN complaints c ON c.assigned_staff_id = u.id
      WHERE u.role IN ('staff', 'maintenance')
      GROUP BY u.id
      ORDER BY active_tickets DESC
    `);

    // Calculate dynamic distribution breakdown
    const [[distribution]] = await pool.query(`
      SELECT
        COUNT(*) AS total_active,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS progress_count,
        SUM(CASE WHEN status = 'emergency' THEN 1 ELSE 0 END) AS emergency_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count
      FROM complaints
    `);

    return res.status(200).json({
      complaints,
      total: totalMatch,
      metrics: {
        total: complaintMetrics.total || 0,
        pending: complaintMetrics.pending || 0,
        in_progress: complaintMetrics.in_progress || 0,
        emergency: complaintMetrics.emergency || 0
      },
      distribution: {
        totalActive: distribution.total_active || 0,
        pendingPercent: distribution.total_active > 0 ? Math.round((distribution.pending_count / distribution.total_active) * 100) : 25,
        progressPercent: distribution.total_active > 0 ? Math.round((distribution.progress_count / distribution.total_active) * 100) : 35,
        emergencyPercent: distribution.total_active > 0 ? Math.round((distribution.emergency_count / distribution.total_active) * 100) : 15,
        resolvedPercent: distribution.total_active > 0 ? Math.round((distribution.resolved_count / distribution.total_active) * 100) : 25
      },
      staffWorkload
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (Admin / Staff / Maintenance)
const updateComplaintStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!status || !['pending', 'in_progress', 'resolved', 'emergency'].includes(status)) {
      return res.status(400).json({ message: 'Invalid or missing status.' });
    }

    // Verify complaint exists
    const [existing] = await pool.query('SELECT * FROM complaints WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    await pool.query('UPDATE complaints SET status = ? WHERE id = ?', [status, id]);
    return res.status(200).json({ message: 'Complaint status updated successfully.' });
  } catch (error) {
    console.error('Update complaint status error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Assign complaint to a staff member
// @route   PUT /api/complaints/:id/assign
// @access  Private (Admin / Staff)
const assignComplaint = async (req, res) => {
  const { id } = req.params;
  const { assigned_staff_id } = req.body;

  try {
    if (!assigned_staff_id) {
      return res.status(400).json({ message: 'Staff ID is required.' });
    }

    // Verify complaint exists
    const [existing] = await pool.query('SELECT * FROM complaints WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Verify assigned user is staff or maintenance
    const [staff] = await pool.query('SELECT role FROM users WHERE id = ?', [assigned_staff_id]);
    if (staff.length === 0 || !['staff', 'maintenance'].includes(staff[0].role)) {
      return res.status(400).json({ message: 'Assigned user must be a valid staff or maintenance worker.' });
    }

    await pool.query('UPDATE complaints SET assigned_staff_id = ? WHERE id = ?', [assigned_staff_id, id]);
    return res.status(200).json({ message: 'Complaint assigned successfully.' });
  } catch (error) {
    console.error('Assign complaint error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  submitComplaint,
  getComplaints,
  updateComplaintStatus,
  assignComplaint
};
