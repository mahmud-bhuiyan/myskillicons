const express = require('express');
const router = express.Router();
const { setupAdmin, loginAdmin, getAllRequests, updateRequestStatus } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

router.post('/setup', setupAdmin);
router.post('/login', loginAdmin);
router.get('/requests', protect, getAllRequests);
router.patch('/requests/:id', protect, updateRequestStatus);

module.exports = router;
