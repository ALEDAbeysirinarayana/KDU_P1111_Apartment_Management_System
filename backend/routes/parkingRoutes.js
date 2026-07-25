const express = require('express');
const router = express.Router();
const {
  getParkingSlots,
  getMyParkingSlots,
  getMyVisitorRequests,
  requestGuestParking,
  approveGuestParking
} = require('../controllers/parkingController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getParkingSlots);
router.get('/my-slots', verifyToken, authorizeRoles('homeowner', 'tenant'), getMyParkingSlots);
router.get('/my-visitor-requests', verifyToken, authorizeRoles('homeowner', 'tenant'), getMyVisitorRequests);
router.post('/request-guest', verifyToken, authorizeRoles('homeowner', 'tenant'), requestGuestParking);
router.put('/approve-guest/:id', verifyToken, authorizeRoles('admin', 'staff'), approveGuestParking);

module.exports = router;
