const express = require('express');
const router = express.Router();
const { getIcons, listIcons } = require('../controllers/iconController');

router.get('/', getIcons);
router.get('/list', listIcons);

module.exports = router;
