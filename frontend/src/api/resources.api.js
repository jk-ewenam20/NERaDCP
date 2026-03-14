import api from './axios';

// Hospitals
export const listHospitals = () => api.get('/hospitals');
export const getHospital = (id) => api.get(`/hospitals/${id}`);
export const createHospital = (payload) => api.post('/hospitals', payload);
export const updateHospital = (id, payload) => api.put(`/hospitals/${id}`, payload);
export const updateHospitalCapacity = (id, availableBeds) =>
  api.put(`/hospitals/${id}/capacity`, { availableBeds });
export const deleteHospital = (id) => api.delete(`/hospitals/${id}`);

// Ambulances
export const listAmbulances = () => api.get('/ambulances');
export const listAvailableAmbulances = () => api.get('/ambulances/available');
export const createAmbulance = (payload) => api.post('/ambulances', payload);
export const updateAmbulanceStatus = (id, status, location) =>
  api.put(`/ambulances/${id}/status`, { status, ...location });
export const assignAmbulanceDriver = (id, driverId) =>
  api.put(`/ambulances/${id}/driver`, { driverId: driverId || null });

// Police stations
export const listPoliceStations = () => api.get('/police-stations');
export const createPoliceStation = (payload) => api.post('/police-stations', payload);
export const updatePoliceStation = (id, payload) => api.put(`/police-stations/${id}`, payload);
export const listOfficers = (stationId) => api.get(`/police-stations/${stationId}/officers`);
export const addOfficer = (stationId, payload) =>
  api.post(`/police-stations/${stationId}/officers`, payload);

// Fire stations
export const listFireStations = () => api.get('/fire-stations');
export const createFireStation = (payload) => api.post('/fire-stations', payload);
export const updateFireStation = (id, payload) => api.put(`/fire-stations/${id}`, payload);
export const listPersonnel = (stationId) => api.get(`/fire-stations/${stationId}/personnel`);
export const addPersonnel = (stationId, payload) =>
  api.post(`/fire-stations/${stationId}/personnel`, payload);
