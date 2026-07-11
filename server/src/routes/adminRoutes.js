const express = require('express');
const router = express.Router();
const {
  setupAdmin,
  loginAdmin,
  getMe,
  updateProfile,
  uploadAvatar,
  updateAvatar,
  deleteAvatar,
  changePassword,
  getAllRequests,
  updateRequestStatus,
} = require('../controllers/adminController');
const {
  uploadSvg,
  listAdminIcons,
  createIcon,
  updateIcon,
  deleteIcon,
} = require('../controllers/adminIconController');
const {
  listCategories,
  updateCategoryOrder,
} = require('../controllers/adminCategoryController');
const { protect } = require('../middleware/authMiddleware');

function handleMulter(upload) {
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  };
}

router.post('/setup', setupAdmin);
router.post('/login', loginAdmin);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/avatar', protect, handleMulter(uploadAvatar), updateAvatar);
router.delete('/avatar', protect, deleteAvatar);
router.patch('/password', protect, changePassword);
router.get('/requests', protect, getAllRequests);
router.patch('/requests/:id', protect, updateRequestStatus);

router.get('/icons', protect, listAdminIcons);
router.post('/icons', protect, handleMulter(uploadSvg), createIcon);
router.put('/icons/:key', protect, handleMulter(uploadSvg), updateIcon);
router.delete('/icons/:key', protect, deleteIcon);

router.get('/categories', protect, listCategories);
router.put('/categories/order', protect, updateCategoryOrder);

module.exports = router;
