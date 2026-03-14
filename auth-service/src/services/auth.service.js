const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');

const SALT_ROUNDS = 12;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

async function register({ name, email, password, role, stationId, organizationId, organizationType }) {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already in use');
    err.status = 409;
    err.code = 'EMAIL_IN_USE';
    throw err;
  }

  // Validate organization requirements for non-system admins
  const NON_ADMIN_ROLES = ['hospital_admin', 'police_admin', 'fire_admin'];
  if (NON_ADMIN_ROLES.includes(role)) {
    if (!organizationId || !organizationType) {
      const err = new Error('organizationId and organizationType are required for admin roles');
      err.status = 400;
      err.code = 'MISSING_ORGANIZATION';
      throw err;
    }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    stationId: stationId || null,
    organizationId: organizationId || null,
    organizationType: organizationType || null,
  });
  return user.toSafeObject();
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }
  if (!user.isActive) {
    const err = new Error('Account is deactivated');
    err.status = 403;
    err.code = 'ACCOUNT_INACTIVE';
    throw err;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store hashed refresh token; compute expiry from JWT
  const decoded = jwt.decode(refreshToken);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(decoded.exp * 1000),
  });

  return { accessToken, refreshToken, user: user.toSafeObject() };
}

async function refreshAccessToken(refreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    err.code = 'INVALID_REFRESH_TOKEN';
    throw err;
  }

  const stored = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) });
  if (!stored) {
    const err = new Error('Refresh token not found or already revoked');
    err.status = 401;
    err.code = 'TOKEN_REVOKED';
    throw err;
  }

  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    const err = new Error('User not found or inactive');
    err.status = 401;
    err.code = 'USER_UNAVAILABLE';
    throw err;
  }

  return { accessToken: generateAccessToken(user) };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
}

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  return user.toSafeObject();
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  const valid = await user.comparePassword(currentPassword);
  if (!valid) {
    const err = new Error('Current password is incorrect');
    err.status = 401;
    err.code = 'INVALID_PASSWORD';
    throw err;
  }
  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
}

async function updateProfile(userId, { name }) {
  const user = await User.findByIdAndUpdate(
    userId,
    { name },
    { new: true, runValidators: true }
  );
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  return user.toSafeObject();
}

async function listUsers({ page = 1, limit = 20, role } = {}) {
  const filter = role ? { role } : {};
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).select('-passwordHash').skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);
  return { users, total, page, totalPages: Math.ceil(total / limit) };
}

async function getUserById(id) {
  const user = await User.findById(id).select('-passwordHash');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  return user;
}

async function setUserStatus(id, isActive) {
  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true }).select('-passwordHash');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  return user;
}

async function deleteUser(id) {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  await RefreshToken.deleteMany({ userId: id });
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  listUsers,
  getUserById,
  setUserStatus,
  deleteUser,
};
