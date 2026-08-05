const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/credentials', getTestCredentials);
router.get('/homeowners', getApprovedHomeowners);
router.get('/available-units', getPublicAvailableUnits);
router.get('/pending-approvals', verifyToken, getPendingApprovals);
router.post('/approve', verifyToken, approveUser);
router.get('/admin-dashboard-stats', verifyToken, getAdminDashboardStats);
router.get('/residents', verifyToken, getApprovedResidents);
router.get('/resident-dashboard-stats', verifyToken, getResidentDashboardStats);
router.put('/profile', verifyToken, updateProfile);

router.get('/users', verifyToken, getAllUsers);
router.post('/users', verifyToken, adminCreateUser);
router.put('/users/:id/status', verifyToken, updateUserStatus);
router.put('/users/:id', verifyToken, adminUpdateUser);
router.delete('/users/:id', verifyToken, deleteUser);

module.exports = router;

