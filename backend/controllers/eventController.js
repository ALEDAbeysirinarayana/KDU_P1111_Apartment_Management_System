const pool = require('../config/db');

// @desc    Get all events with metrics and participation overview
// @route   GET /api/events
// @access  Private (All Roles)
const getEvents = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT e.*, COUNT(r.id) AS regs
      FROM events e
      LEFT JOIN event_registrations r ON e.id = r.event_id
    `;
    let params = [];

    if (search && search.trim() !== '') {
      query += ` WHERE e.name LIKE ? OR e.type LIKE ? OR e.location LIKE ? OR e.event_id LIKE ?`;
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` GROUP BY e.id ORDER BY e.date ASC, e.time ASC`;

    const [events] = await pool.query(query, params);

    // Calculate metrics
    const [[metrics]] = await pool.query(`
      SELECT 
        COUNT(*) AS total_events,
        SUM(CASE WHEN status IN ('Upcoming', 'Registration Open') THEN 1 ELSE 0 END) AS upcoming_events,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_events
      FROM events
    `);

    const [[regsMetric]] = await pool.query(`
      SELECT COUNT(*) AS active_registrations FROM event_registrations
    `);

    // Participation Overview (Top events with highest registrations)
    const [participationOverview] = await pool.query(`
      SELECT e.name, COUNT(r.id) AS residents
      FROM events e
      LEFT JOIN event_registrations r ON e.id = r.event_id
      GROUP BY e.id
      ORDER BY residents DESC
      LIMIT 5
    `);

    return res.status(200).json({
      events,
      metrics: {
        totalEvents: metrics.total_events || 0,
        upcomingEvents: metrics.upcoming_events || 0,
        activeRegistrations: regsMetric.active_registrations || 0,
        completedEvents: metrics.completed_events || 0
      },
      participationOverview
    });
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Create a new community event
// @route   POST /api/events
// @access  Private (Admin/Staff)
const createEvent = async (req, res) => {
  const { name, type, date, time, location, status = 'Upcoming' } = req.body;

  try {
    if (!name || !type || !date || !time || !location) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Generate unique EV-xxx ID
    const randomNum = Math.floor(100 + Math.random() * 900);
    const eventIdStr = `EV-${randomNum}`;

    await pool.query(
      'INSERT INTO events (event_id, name, type, date, time, location, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [eventIdStr, name, type, date, time, location, status]
    );

    return res.status(201).json({
      message: 'Event created successfully.',
      eventId: eventIdStr
    });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Update an existing event
// @route   PUT /api/events/:id
// @access  Private (Admin/Staff)
const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { name, type, date, time, location, status } = req.body;

  try {
    // Check if event exists
    const [existing] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    await pool.query(
      'UPDATE events SET name = ?, type = ?, date = ?, time = ?, location = ?, status = ? WHERE id = ?',
      [name, type, date, time, location, status, id]
    );

    return res.status(200).json({ message: 'Event updated successfully.' });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Admin/Staff)
const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    await pool.query('DELETE FROM events WHERE id = ?', [id]);
    return res.status(200).json({ message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get all resident event registrations
// @route   GET /api/events/registrations
// @access  Private (Admin/Staff/Maintenance)
const getRegistrations = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        r.id,
        r.reg_id,
        r.attendance,
        e.name AS event_name,
        e.date AS event_date,
        u.full_name AS resident_name,
        u.building_name AS resident_building,
        u.unit_number AS resident_unit
      FROM event_registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
    `;
    let params = [];

    if (search && search.trim() !== '') {
      query += ` WHERE e.name LIKE ? OR u.full_name LIKE ? OR r.reg_id LIKE ? OR u.unit_number LIKE ?`;
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY r.created_at DESC`;

    const [registrations] = await pool.query(query, params);
    return res.status(200).json(registrations);
  } catch (error) {
    console.error('Get registrations error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Update attendance of a registration
// @route   PUT /api/events/registrations/:id/attendance
// @access  Private (Admin/Staff/Maintenance)
const updateAttendance = async (req, res) => {
  const { id } = req.params;
  const { attendance } = req.body;

  try {
    if (!attendance || !['registered', 'attended', 'no_show'].includes(attendance)) {
      return res.status(400).json({ message: 'Invalid or missing attendance status.' });
    }

    const [existing] = await pool.query('SELECT * FROM event_registrations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Registration record not found.' });
    }

    await pool.query('UPDATE event_registrations SET attendance = ? WHERE id = ?', [attendance, id]);
    return res.status(200).json({ message: 'Attendance status updated successfully.' });
  } catch (error) {
    console.error('Update attendance error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Register current resident for an event
// @route   POST /api/events/:id/register
// @access  Private (Homeowner/Tenant)
const registerForEvent = async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if event exists
    const [event] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (event.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (event[0].status === 'Completed') {
      return res.status(400).json({ message: 'Cannot register for a completed event.' });
    }

    // Check if already registered
    const [existing] = await pool.query(
      'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'You are already registered for this event.' });
    }

    // Generate RG-xxxx ID
    const randomNum = Math.floor(100 + Math.random() * 900);
    const regIdStr = `RG-1${randomNum}`;

    await pool.query(
      'INSERT INTO event_registrations (reg_id, event_id, user_id, attendance) VALUES (?, ?, ?, ?)',
      [regIdStr, eventId, userId, 'registered']
    );

    return res.status(201).json({
      message: 'Successfully registered for the event.',
      regId: regIdStr
    });
  } catch (error) {
    console.error('Register for event error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Unregister current resident from an event
// @route   POST /api/events/:id/unregister
// @access  Private (Homeowner/Tenant)
const unregisterFromEvent = async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  try {
    const [existing] = await pool.query(
      'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Registration record not found.' });
    }

    await pool.query(
      'DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    return res.status(200).json({ message: 'Successfully unregistered from the event.' });
  } catch (error) {
    console.error('Unregister from event error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get all registrations of current user
// @route   GET /api/events/my-registrations
// @access  Private (Homeowner/Tenant)
const getMyRegistrations = async (req, res) => {
  const userId = req.user.id;

  try {
    const [registrations] = await pool.query(
      'SELECT event_id FROM event_registrations WHERE user_id = ?',
      [userId]
    );

    const registeredIds = registrations.map(r => r.event_id);
    return res.status(200).json(registeredIds);
  } catch (error) {
    console.error('Get my registrations error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getRegistrations,
  updateAttendance,
  registerForEvent,
  unregisterFromEvent,
  getMyRegistrations
};
