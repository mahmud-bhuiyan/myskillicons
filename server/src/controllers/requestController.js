const IconRequest = require('../models/IconRequest');

function sanitizeRequest(doc) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.clientInfo;
  delete obj.upvotedBy;
  return obj;
}

/**
 * POST /api/v1/request — Submit a new icon request
 */
const submitRequest = async (req, res) => {
  try {
    const { iconName, description, referenceUrl, submittedSvg, submitterEmail, submitterName } = req.body;

    if (!iconName || !description || !submitterEmail) {
      return res.status(400).json({ error: 'iconName, description, and submitterEmail are required' });
    }

    const existing = await IconRequest.findOne({
      iconName: { $regex: new RegExp(`^${iconName}$`, 'i') },
      status: 'pending',
    });

    if (existing) {
      if (!existing.upvotedBy.includes(submitterEmail)) {
        existing.upvotes += 1;
        existing.upvotedBy.push(submitterEmail);
        await existing.save();
      }
      return res.status(200).json({
        message: 'A request for this icon already exists. Your upvote has been added.',
        request: sanitizeRequest(existing),
      });
    }

    const newRequest = await IconRequest.create({
      iconName,
      description,
      referenceUrl,
      submittedSvg,
      submitterEmail,
      submitterName,
      clientInfo: req.clientInfo,
    });

    res.status(201).json({
      message: 'Icon request submitted successfully',
      request: sanitizeRequest(newRequest),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/request — Get all pending requests (public, sorted by upvotes)
 */
const getRequests = async (req, res) => {
  try {
    const requests = await IconRequest.find({ status: 'pending' })
      .select('-upvotedBy -clientInfo')
      .sort({ upvotes: -1, createdAt: -1 });

    res.json({ total: requests.length, requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/v1/request/:id/upvote — Upvote an existing request
 */
const upvoteRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required to upvote' });

    const request = await IconRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.upvotedBy.includes(email)) {
      return res.status(400).json({ error: 'You have already upvoted this request' });
    }

    request.upvotes += 1;
    request.upvotedBy.push(email);
    await request.save();

    res.json({ message: 'Upvote added successfully', upvotes: request.upvotes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { submitRequest, getRequests, upvoteRequest };
