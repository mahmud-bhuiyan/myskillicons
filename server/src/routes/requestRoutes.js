const express = require('express');
const router = express.Router();
const { submitRequest, getRequests, upvoteRequest } = require('../controllers/requestController');

router.post('/', submitRequest);
router.get('/', getRequests);
router.post('/:id/upvote', upvoteRequest);

module.exports = router;
