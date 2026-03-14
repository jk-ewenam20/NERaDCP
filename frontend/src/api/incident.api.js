import api from './axios';

export const createIncident = (payload) =>
  api.post('/incidents', payload);

export const listIncidents = (params) =>
  api.get('/incidents', { params });

export const listOpenIncidents = () =>
  api.get('/incidents/open');

export const getIncident = (id) =>
  api.get(`/incidents/${id}`);

export const updateIncidentStatus = (id, status) =>
  api.put(`/incidents/${id}/status`, { status });

export const reassignIncident = (id, unitId, unitType) =>
  api.put(`/incidents/${id}/assign`, { unitId, unitType });

export const getIncidentStats = () =>
  api.get('/incidents/stats');

// Organizations
export const listHospitals = () =>
  api.get('/hospitals');

export const getHospital = (id) =>
  api.get(`/hospitals/${id}`);

export const updateHospitalCapacity = (id, availableBeds) =>
  api.put(`/hospitals/${id}/capacity`, { availableBeds });

export const listPoliceStations = () =>
  api.get('/police-stations');

export const listFireStations = () =>
  api.get('/fire-stations');
