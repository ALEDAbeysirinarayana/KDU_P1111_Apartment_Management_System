const express = require('express');
const router = express.Router();
const { createNotice, getNotices, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', verifyToken, authorizeRoles('admin', 'staff'), createNotice);
router.get('/', verifyToken, getNotices);
router.put('/:id', verifyToken, authorizeRoles('admin', 'staff'), updateNotice);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'staff'), deleteNotice);

module.exports = router;
