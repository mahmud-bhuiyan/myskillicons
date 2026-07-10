const express = require('express');
const router = express.Router();
const { getGallery, getCategories } = require('../controllers/galleryController');

router.get('/', getGallery);
router.get('/categories', getCategories);

module.exports = router;
