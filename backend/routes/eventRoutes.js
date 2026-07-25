const express = require('express');
const router = express.Router();
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getRegistrations,
  updateAttendance,
  registerForEvent,
  unregisterFromEvent,
  getMyRegistrations
} = require('../controllers/eventController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Event routes
router.get('/', verifyToken, getEvents);
router.post('/', verifyToken, authorizeRoles('admin', 'staff'), createEvent);
router.put('/:id', verifyToken, authorizeRoles('admin', 'staff'), updateEvent);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'staff'), deleteEvent);

// Registration routes for Admins
router.get('/registrations', verifyToken, authorizeRoles('admin', 'staff', 'maintenance'), getRegistrations);
router.put('/registrations/:id/attendance', verifyToken, authorizeRoles('admin', 'staff', 'maintenance'), updateAttendance);

// Resident action routes
router.get('/my-registrations', verifyToken, authorizeRoles('homeowner', 'tenant'), getMyRegistrations);
router.post('/:id/register', verifyToken, authorizeRoles('homeowner', 'tenant'), registerForEvent);
router.post('/:id/unregister', verifyToken, authorizeRoles('homeowner', 'tenant'), unregisterFromEvent);

module.exports = router;
