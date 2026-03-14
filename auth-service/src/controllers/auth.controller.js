const authService = require('../services/auth.service');

function handleError(res, err) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'An unexpected error occurred' : err.message;
  if (status === 500) console.error(err);
  return res.status(status).json({ success: false, error: { code, message } });
}

async function register(req, res) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    handleError(res, err);
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    handleError(res, err);
  }
}

async function refreshToken(req, res) {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    handleError(res, err);
  }
}

async function logout(req, res) {
  try {
    await authService.logout(req.body.refreshToken);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    handleError(res, err);
  }
}

async function getProfile(req, res) {
  try {
    const user = await authService.getProfile(req.user.userId);
    res.json({ success: true, data: { user } });
  } catch (err) {
    handleError(res, err);
  }
}

async function updateProfile(req, res) {
  try {
    const user = await authService.updateProfile(req.user.userId, req.body);
    res.json({ success: true, data: { user } });
  } catch (err) {
    handleError(res, err);
  }
}

async function listUsers(req, res) {
  try {
    const { page, limit, role } = req.query;
    const result = await authService.listUsers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      role,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    handleError(res, err);
  }
}

async function getUserById(req, res) {
  try {
    const user = await authService.getUserById(req.params.id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    handleError(res, err);
  }
}

async function setUserStatus(req, res) {
  try {
    const user = await authService.setUserStatus(req.params.id, req.body.isActive);
    res.json({ success: true, data: { user } });
  } catch (err) {
    handleError(res, err);
  }
}

async function deleteUser(req, res) {
  try {
    await authService.deleteUser(req.params.id);
    res.json({ success: true, data: { message: 'User deleted' } });
  } catch (err) {
    handleError(res, err);
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  listUsers,
  getUserById,
  setUserStatus,
  deleteUser,
};
