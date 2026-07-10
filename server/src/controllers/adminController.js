const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const IconRequest = require('../models/IconRequest');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

/**
 * POST /api/v1/admin/setup — Create admin account (only works if no admin exists)
 */
const setupAdmin = async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) return res.status(403).json({ error: 'Admin already exists' });

    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const admin = await Admin.create({ username, password });
    res.status(201).json({ message: 'Admin created', token: generateToken(admin._id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/v1/admin/login
 */
const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ token: generateToken(admin._id), username: admin.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/admin/requests — All requests (all statuses) for admin view
 */
const getAllRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const requests = await IconRequest.find({ status })
      .sort({ upvotes: -1, createdAt: -1 });
    res.json({ total: requests.length, requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/v1/admin/requests/:id — Update status of a request
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'in-progress'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await IconRequest.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    );

    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Request updated', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { setupAdmin, loginAdmin, getAllRequests, updateRequestStatus };
