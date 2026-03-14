import api from './axios';

export const listVehicles = () => api.get('/vehicles');
export const getVehicleLocation = (id) => api.get(`/vehicles/${id}/location`);
export const pushLocation = (id, payload) => api.post(`/vehicles/${id}/location`, payload);

export const listDispatches = () => api.get('/dispatches');
export const getDispatchByIncident = (incidentId) => api.get(`/dispatches/${incidentId}`);
export const updateDispatchStatus = (id, status) =>
  api.put(`/dispatches/${id}/status`, { status });

export const pushVehicleLocation = (vehicleId, payload) =>
  api.post(`/vehicles/${vehicleId}/location`, payload);
