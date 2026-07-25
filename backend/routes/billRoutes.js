const express = require('express');
const router = express.Router();
const { createBill, getBills, payBill, updateBillStatus, deleteBill, getTransactions } = require('../controllers/billController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/transactions', verifyToken, authorizeRoles('admin', 'staff'), getTransactions);
router.get('/', verifyToken, getBills);
router.post('/', verifyToken, authorizeRoles('admin', 'staff'), createBill);
router.put('/:id/pay', verifyToken, authorizeRoles('homeowner', 'tenant'), payBill);
router.put('/:id/status', verifyToken, authorizeRoles('admin', 'staff'), updateBillStatus);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'staff'), deleteBill);

module.exports = router;
