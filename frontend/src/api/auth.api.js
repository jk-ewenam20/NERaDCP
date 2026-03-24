import api from './axios';

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (payload) =>
  api.post('/auth/register', payload);

export const logout = (refreshToken) =>
  api.post('/auth/logout', { refreshToken });

export const getProfile = () =>
  api.get('/auth/profile');

export const updateProfile = (payload) =>
  api.put('/auth/profile', payload);

export const listDrivers = () =>
  api.get('/auth/drivers');

export const listUsers = () =>
  api.get('/auth/users');

export const changePassword = (currentPassword, newPassword) =>
  api.put('/auth/profile/password', { currentPassword, newPassword });

export const updateUser = (id, payload) =>
  api.put(`/auth/users/${id}`, payload);

export const updateUserStatus = (id, isActive) =>
  api.put(`/auth/users/${id}/status`, { isActive });

export const deleteUser = (id) =>
  api.delete(`/auth/users/${id}`);
