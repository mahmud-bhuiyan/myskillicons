const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Admin = require('../models/Admin');
const IconRequest = require('../models/IconRequest');

const generateToken = (id) => jwt.sign({ id }, process.env.ADMIN_JWT_SECRET, { expiresIn: '7d' });

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const AVATAR_DIR = path.join(__dirname, '../../uploads/avatars');

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${req.admin.id}-${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
}).single('avatar');

function removeAvatarFile(avatarUrl) {
  if (!avatarUrl || !avatarUrl.startsWith('/uploads/avatars/')) return;
  const filePath = path.join(__dirname, '../..', avatarUrl);
  fs.promises.unlink(filePath).catch(() => {});
}

/**
 * POST /api/v1/admin/setup — Create admin account (only works if no admin exists).
 * Requires setupKey (body) or x-setup-key (header) matching ADMIN_JWT_SECRET.
 */
const setupAdmin = async (req, res) => {
  try {
    const expected = process.env.ADMIN_JWT_SECRET;
    if (!expected) {
      return res.status(500).json({ error: 'ADMIN_JWT_SECRET is not configured on the server' });
    }

    const provided = req.body?.setupKey || req.get('x-setup-key') || '';
    if (!safeEqual(provided, expected)) {
      return res.status(403).json({ error: 'Invalid or missing setup key' });
    }

    const count = await Admin.countDocuments();
    if (count > 0) return res.status(403).json({ error: 'Admin already exists' });

    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const admin = await Admin.create({ username, password });
    res.status(201).json({
      message: 'Admin created',
      token: generateToken(admin._id),
      username: admin.username,
      avatar: admin.avatar || '',
    });
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

    res.json({
      token: generateToken(admin._id),
      username: admin.username,
      avatar: admin.avatar || '',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/admin/me — Current admin profile
 */
const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('username avatar createdAt');
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json({ username: admin.username, avatar: admin.avatar || '', createdAt: admin.createdAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/v1/admin/profile — Update username
 */
const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'username is required' });
    }

    const nextUsername = username.trim();
    if (nextUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const taken = await Admin.findOne({
      username: nextUsername,
      _id: { $ne: req.admin.id },
    });
    if (taken) return res.status(409).json({ error: 'Username already taken' });

    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      { username: nextUsername },
      { new: true }
    ).select('username avatar createdAt');

    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json({ message: 'Profile updated', username: admin.username, avatar: admin.avatar || '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/v1/admin/avatar — Upload profile image
 */
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Avatar image is required' });

    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const previous = admin.avatar;
    admin.avatar = `/uploads/avatars/${req.file.filename}`;
    await admin.save();
    removeAvatarFile(previous);

    res.json({ message: 'Avatar updated', avatar: admin.avatar, username: admin.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/v1/admin/avatar — Remove profile image
 */
const deleteAvatar = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    removeAvatarFile(admin.avatar);
    admin.avatar = '';
    await admin.save();
    res.json({ message: 'Avatar removed', avatar: '', username: admin.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/v1/admin/password — Change password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    if (!(await admin.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();
    res.json({ message: 'Password updated successfully' });
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

module.exports = {
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
};
