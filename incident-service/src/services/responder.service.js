const Ambulance = require('../models/ambulance.model');
const PoliceStation = require('../models/policeStation.model');
const FireStation = require('../models/fireStation.model');
const Hospital = require('../models/hospital.model');

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * (Math.PI / 180); }

function estimateMinutes(distanceMeters) {
  return Math.round((distanceMeters / 1000 / 30) * 60);
}

async function findNearest({ lat, lng, type, maxDistance = 50000 }) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const coordinates = [longitude, latitude];

  const geoQuery = {
    $near: {
      $geometry: { type: 'Point', coordinates },
      $maxDistance: parseInt(maxDistance),
    },
  };

  if (type === 'medical') {
    const ambulance = await Ambulance.findOne({ status: 'available', currentLocation: geoQuery });
    if (!ambulance) {
      const err = new Error('No available ambulance found within range');
      err.status = 404; err.code = 'NO_RESPONDER_AVAILABLE'; throw err;
    }
    const [ambLng, ambLat] = ambulance.currentLocation.coordinates;
    const distanceMeters = haversineDistance(latitude, longitude, ambLat, ambLng);
    const hospital = await Hospital.findById(ambulance.hospitalId);
    const hospitalName = hospital ? hospital.name : null;
    return {
      unitId: ambulance._id,
      unitType: 'ambulance',
      unitName: hospitalName ? `${ambulance.vehicleNumber} — ${hospitalName}` : ambulance.vehicleNumber,
      hospitalId: ambulance.hospitalId,
      hospitalName,
      distanceMeters: Math.round(distanceMeters),
      estimatedMinutes: estimateMinutes(distanceMeters),
    };
  }

  if (type === 'fire') {
    const station = await FireStation.findOne({ status: 'active', location: geoQuery });
    if (!station) {
      const err = new Error('No active fire station found within range');
      err.status = 404; err.code = 'NO_RESPONDER_AVAILABLE'; throw err;
    }
    const [sLng, sLat] = station.location.coordinates;
    const distanceMeters = haversineDistance(latitude, longitude, sLat, sLng);
    return {
      unitId: station._id, unitType: 'fire_station', unitName: station.name,
      distanceMeters: Math.round(distanceMeters), estimatedMinutes: estimateMinutes(distanceMeters),
    };
  }

  if (type === 'crime') {
    const station = await PoliceStation.findOne({ status: 'active', location: geoQuery });
    if (!station) {
      const err = new Error('No active police station found within range');
      err.status = 404; err.code = 'NO_RESPONDER_AVAILABLE'; throw err;
    }
    const [sLng, sLat] = station.location.coordinates;
    const distanceMeters = haversineDistance(latitude, longitude, sLat, sLng);
    return {
      unitId: station._id, unitType: 'police_station', unitName: station.name,
      distanceMeters: Math.round(distanceMeters), estimatedMinutes: estimateMinutes(distanceMeters),
    };
  }

  const err = new Error('Invalid type. Must be: medical, fire, or crime');
  err.status = 400; err.code = 'INVALID_TYPE'; throw err;
}

module.exports = { findNearest };
