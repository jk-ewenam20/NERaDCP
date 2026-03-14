import api from './axios';

export const getOverview = () =>
  api.get('/analytics/overview');

export const getResponseTimes = (params) =>
  api.get('/analytics/response-times', { params });

export const getIncidentsByType = () =>
  api.get('/analytics/incidents-by-type');

export const getIncidentsByRegion = () =>
  api.get('/analytics/incidents-by-region');

export const getResourceUtilization = () =>
  api.get('/analytics/resource-utilization');

export const getTopResponders = () =>
  api.get('/analytics/top-responders');
