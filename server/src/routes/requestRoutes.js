const express = require('express');
const router = express.Router();
const { submitRequest, getRequests, upvoteRequest } = require('../controllers/requestController');
const { rateLimit } = require('../middleware/rateLimitMiddleware');

router.post('/', rateLimit('submit'), submitRequest);
router.get('/', getRequests);
router.post('/:id/upvote', rateLimit('upvote'), upvoteRequest);

module.exports = router;
