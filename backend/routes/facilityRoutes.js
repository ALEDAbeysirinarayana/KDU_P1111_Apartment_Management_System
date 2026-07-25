const express = require('express');
const router = express.Router();
const {
  reserveFacility,
  getReservations,
  approveReservation,
  getFacilities,
  createFacility,
  updateFacility,
  deleteFacility
} = require('../controllers/facilityController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/reserve', verifyToken, authorizeRoles('homeowner', 'tenant'), reserveFacility);
router.get('/reservations', verifyToken, getReservations);
router.put('/reservations/:id/approve', verifyToken, authorizeRoles('admin', 'staff'), approveReservation);

router.get('/', verifyToken, getFacilities);
router.post('/', verifyToken, authorizeRoles('admin'), createFacility);
router.put('/:id', verifyToken, authorizeRoles('admin'), updateFacility);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteFacility);

module.exports = router;
