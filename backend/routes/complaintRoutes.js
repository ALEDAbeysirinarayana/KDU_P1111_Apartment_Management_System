const express = require('express');
const router = express.Router();
const {
  submitComplaint,
  getMyComplaintStats,
  getComplaints,
  updateComplaintStatus,
  assignComplaint
} = require('../controllers/complaintController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Per-user stats for dashboard cards (must come BEFORE the generic GET /)
router.get('/my-stats', verifyToken, getMyComplaintStats);

router.post('/', verifyToken, authorizeRoles('homeowner', 'tenant'), submitComplaint);
router.get('/', verifyToken, getComplaints);
router.put('/:id/status', verifyToken, authorizeRoles('admin', 'staff', 'maintenance'), updateComplaintStatus);
router.put('/:id/assign', verifyToken, authorizeRoles('admin', 'staff'), assignComplaint);

module.exports = router;
