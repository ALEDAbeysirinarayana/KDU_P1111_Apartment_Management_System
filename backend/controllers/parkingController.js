const pool = require('../config/db');

// Helper to get unit ID for a resident
async function getResidentUnitId(userId, role) {
  let query = '';
  if (role === 'homeowner') {
    query = 'SELECT id FROM units WHERE owner_id = ?';
  } else if (role === 'tenant') {
    query = 'SELECT id FROM units WHERE tenant_id = ?';
  } else {
    return null;
  }
  const [units] = await pool.query(query, [userId]);
  return units.length > 0 ? units[0].id : null;
}

// @desc    Get all parking slots
// @route   GET /api/parking
// @access  Private
const getParkingSlots = async (req, res) => {
  try {
    const [slots] = await pool.query(`
      SELECT 
        p.*, 
        u.block_name, 
        u.floor_number, 
        u.unit_number,
        COALESCE(tenant.full_name, owner.full_name) AS resident_name,
        COALESCE(tenant.vehicle_number, owner.vehicle_number) AS vehicle_number
      FROM parking_management p
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN users tenant ON u.tenant_id = tenant.id
      LEFT JOIN users owner ON u.owner_id = owner.id
      ORDER BY p.type, p.slot_number
    `);
    return res.status(200).json(slots);
  } catch (error) {
    console.error('Get parking slots error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get parking slots associated with the logged-in resident's unit
// @route   GET /api/parking/my-slots
// @access  Private (Homeowner / Tenant)
const getMyParkingSlots = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    const unitId = await getResidentUnitId(userId, role);
    if (!unitId) {
      return res.status(200).json([]); // Return empty instead of error
    }

    const [slots] = await pool.query(
      'SELECT * FROM parking_management WHERE unit_id = ? AND (type = "permanent" OR status = "approved")',
      [unitId]
    );

    return res.status(200).json(slots);
  } catch (error) {
    console.error('Get my parking slots error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get visitor parking requests for logged-in resident
// @route   GET /api/parking/my-visitor-requests
// @access  Private (Homeowner / Tenant)
const getMyVisitorRequests = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    const unitId = await getResidentUnitId(userId, role);
    if (!unitId) {
      return res.status(200).json([]);
    }

    const [requests] = await pool.query(
      `SELECT * FROM parking_management 
       WHERE unit_id = ? AND type = 'guest'
       ORDER BY created_at DESC`,
      [unitId]
    );

    return res.status(200).json(requests);
  } catch (error) {
    console.error('Get my visitor requests error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Request guest parking
// @route   POST /api/parking/request-guest
// @access  Private (Homeowner / Tenant)
const requestGuestParking = async (req, res) => {
  const { slot_number, guest_date, visitor_name, visitor_vehicle, arrival_time, reason } = req.body;
  const { id: userId, role } = req.user;

  try {
    if (!slot_number || !guest_date) {
      return res.status(400).json({ message: 'Slot number and guest date are required.' });
    }

    const unitId = await getResidentUnitId(userId, role);
    if (!unitId) {
      return res.status(400).json({ message: 'Only residents associated with a unit can request guest parking.' });
    }

    const [existingBookings] = await pool.query(
      'SELECT id, status FROM parking_management WHERE slot_number = ? AND guest_date = ?',
      [slot_number, guest_date]
    );

    const isBooked = existingBookings.some(booking => ['approved', 'pending', 'active'].includes(booking.status));
    if (isBooked) {
      return res.status(400).json({ message: 'This guest parking slot is already requested or approved for this date.' });
    }

    await pool.query(
      `INSERT INTO parking_management 
       (unit_id, slot_number, type, guest_date, visitor_name, visitor_vehicle, arrival_time, reason, status) 
       VALUES (?, ?, 'guest', ?, ?, ?, ?, ?, 'pending')`,
      [unitId, slot_number, guest_date, visitor_name || null, visitor_vehicle || null, arrival_time || null, reason || null]
    );

    return res.status(201).json({ message: 'Guest parking request submitted successfully.' });
  } catch (error) {
    console.error('Request guest parking error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Approve or reject guest parking request
// @route   PUT /api/parking/approve-guest/:id
// @access  Private (Admin / Staff)
const approveGuestParking = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (approved/rejected) is required.' });
    }

    const [request] = await pool.query('SELECT * FROM parking_management WHERE id = ? AND type = "guest"', [id]);
    if (request.length === 0) {
      return res.status(404).json({ message: 'Guest parking request not found.' });
    }

    if (status === 'approved') {
      const [alreadyApproved] = await pool.query(
        'SELECT id FROM parking_management WHERE slot_number = ? AND guest_date = ? AND status = "approved" AND id != ?',
        [request[0].slot_number, request[0].guest_date, id]
      );

      if (alreadyApproved.length > 0) {
        return res.status(400).json({ message: 'Cannot approve. Another request is already approved for this slot on this date.' });
      }

      await pool.query('UPDATE parking_management SET status = "approved" WHERE id = ?', [id]);
      await pool.query(
        'UPDATE parking_management SET status = "rejected" WHERE slot_number = ? AND guest_date = ? AND status = "pending" AND id != ?',
        [request[0].slot_number, request[0].guest_date, id]
      );
    } else {
      await pool.query('UPDATE parking_management SET status = "rejected" WHERE id = ?', [id]);
    }

    return res.status(200).json({ message: `Guest parking request has been ${status}.` });
  } catch (error) {
    console.error('Approve guest parking error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getParkingSlots,
  getMyParkingSlots,
  getMyVisitorRequests,
  requestGuestParking,
  approveGuestParking
};
