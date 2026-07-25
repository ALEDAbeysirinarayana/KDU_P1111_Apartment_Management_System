const pool = require('../config/db');

// @desc    Request a facility reservation
// @route   POST /api/facilities/reserve
// @access  Private (Homeowner / Tenant)
const reserveFacility = async (req, res) => {
  const { facility_name, date } = req.body;
  const userId = req.user.id;

  try {
    if (!facility_name || !date) {
      return res.status(400).json({ message: 'Facility name and date are required.' });
    }

    // Check if the facility is already booked and approved on this date
    const [alreadyBooked] = await pool.query(
      'SELECT id FROM facility_reservations WHERE facility_name = ? AND date = ? AND status = "approved"',
      [facility_name, date]
    );

    if (alreadyBooked.length > 0) {
      return res.status(400).json({ message: 'This facility is already reserved and approved for this date.' });
    }

    // Insert reservation request (pending by default)
    const [result] = await pool.query(
      'INSERT INTO facility_reservations (user_id, facility_name, date, status) VALUES (?, ?, ?, ?)',
      [userId, facility_name, date, 'pending']
    );

    return res.status(201).json({
      message: 'Facility reservation requested successfully.',
      reservationId: result.insertId
    });
  } catch (error) {
    console.error('Reserve facility error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get reservations list based on role
// @route   GET /api/facilities/reservations
// @access  Private (All Roles)
const getReservations = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    let query = '';
    let params = [];

    if (role === 'admin' || role === 'staff') {
      // Admin/Staff see all reservations with joined resident details
      query = `
        SELECT 
          r.*, 
          u.email AS resident_email,
          u.full_name AS resident_name,
          u.building_name AS resident_building,
          u.unit_number AS resident_unit
        FROM facility_reservations r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.date DESC
      `;
    } else {
      // Residents see only their own reservations
      query = `
        SELECT r.*, u.full_name AS resident_name
        FROM facility_reservations r
        JOIN users u ON r.user_id = u.id
        WHERE r.user_id = ? 
        ORDER BY r.date DESC
      `;
      params = [userId];
    }

    const [reservations] = await pool.query(query, params);

    // Calculate dynamic stats metrics
    const [[facCount]] = await pool.query('SELECT COUNT(*) AS count FROM facilities');
    const [[activeCount]] = await pool.query('SELECT COUNT(*) AS count FROM facility_reservations WHERE status = "approved"');
    const [[pendingCount]] = await pool.query('SELECT COUNT(*) AS count FROM facility_reservations WHERE status = "pending"');
    const [[parkingCount]] = await pool.query('SELECT COUNT(*) AS count FROM parking_management');

    return res.status(200).json({
      reservations,
      metrics: {
        totalFacilities: facCount.count || 0,
        activeBookings: activeCount.count || 0,
        pendingRequests: pendingCount.count || 0,
        totalParkingSlots: parkingCount.count || 0
      }
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Approve or reject a reservation
// @route   PUT /api/facilities/reservations/:id/approve
// @access  Private (Admin / Staff)
const approveReservation = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  try {
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (approved/rejected) is required.' });
    }

    // Check if reservation exists
    const [reservation] = await pool.query('SELECT * FROM facility_reservations WHERE id = ?', [id]);
    if (reservation.length === 0) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    const targetReservation = reservation[0];

    if (status === 'approved') {
      // Make sure there is no already approved booking on that date
      const [alreadyBooked] = await pool.query(
        'SELECT id FROM facility_reservations WHERE facility_name = ? AND date = ? AND status = "approved" AND id != ?',
        [targetReservation.facility_name, targetReservation.date, id]
      );

      if (alreadyBooked.length > 0) {
        return res.status(400).json({ message: 'Cannot approve. Another request is already approved for this date.' });
      }

      // Approve this one
      await pool.query('UPDATE facility_reservations SET status = "approved" WHERE id = ?', [id]);

      // Automatically reject all other pending requests for the same facility on the same date!
      await pool.query(
        'UPDATE facility_reservations SET status = "rejected" WHERE facility_name = ? AND date = ? AND status = "pending" AND id != ?',
        [targetReservation.facility_name, targetReservation.date, id]
      );
    } else {
      // Just reject
      await pool.query('UPDATE facility_reservations SET status = "rejected" WHERE id = ?', [id]);
    }

    return res.status(200).json({ message: `Reservation has been ${status}.` });
  } catch (error) {
    console.error('Approve reservation error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get all facilities
// @route   GET /api/facilities
// @access  Private (All Roles)
const getFacilities = async (req, res) => {
  try {
    const [facilities] = await pool.query('SELECT * FROM facilities ORDER BY facility_id');
    return res.status(200).json(facilities);
  } catch (error) {
    console.error('Get facilities error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Create new facility
// @route   POST /api/facilities
// @access  Private (Admin Only)
const createFacility = async (req, res) => {
  const { facility_id, name, description, capacity, status } = req.body;
  try {
    if (!facility_id || !name || !capacity) {
      return res.status(400).json({ message: 'Facility ID, name, and capacity are required.' });
    }
    await pool.query(
      'INSERT INTO facilities (facility_id, name, description, capacity, status) VALUES (?, ?, ?, ?, ?)',
      [facility_id, name, description, parseInt(capacity), status || 'available']
    );
    return res.status(201).json({ message: 'Facility created successfully.' });
  } catch (error) {
    console.error('Create facility error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Update facility details
// @route   PUT /api/facilities/:id
// @access  Private (Admin Only)
const updateFacility = async (req, res) => {
  const { id } = req.params;
  const { facility_id, name, description, capacity, status } = req.body;
  try {
    await pool.query(
      'UPDATE facilities SET facility_id = ?, name = ?, description = ?, capacity = ?, status = ? WHERE id = ?',
      [facility_id, name, description, parseInt(capacity), status, id]
    );
    return res.status(200).json({ message: 'Facility updated successfully.' });
  } catch (error) {
    console.error('Update facility error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Delete a facility
// @route   DELETE /api/facilities/:id
// @access  Private (Admin Only)
const deleteFacility = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM facilities WHERE id = ?', [id]);
    return res.status(200).json({ message: 'Facility deleted successfully.' });
  } catch (error) {
    console.error('Delete facility error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  reserveFacility,
  getReservations,
  approveReservation,
  getFacilities,
  createFacility,
  updateFacility,
  deleteFacility
};
