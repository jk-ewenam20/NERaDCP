const axios = require('axios');

const RESPONDER_URL = process.env.RESPONDER_SERVICE_URL || 'http://responder-service:3002';

// Called internally with a service-level token (passed from the request's JWT)
async function findNearest({ lat, lng, type, token }) {
  const response = await axios.get(`${RESPONDER_URL}/api/v1/responders/nearest`, {
    params: { lat, lng, type },
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000,
  });
  return response.data.data.responder;
}

module.exports = { findNearest };
