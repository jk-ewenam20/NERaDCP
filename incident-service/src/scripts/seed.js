require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Hospital     = require('../models/hospital.model');
const Ambulance    = require('../models/ambulance.model');
const PoliceStation = require('../models/policeStation.model');
const FireStation  = require('../models/fireStation.model');

const HOSPITALS = [
  {
    name: 'Korle Bu Teaching Hospital',
    address: 'Guggisberg Ave, Korle Bu, Accra',
    location: { type: 'Point', coordinates: [-0.2311, 5.5386] },
    totalBeds: 2000, availableBeds: 120,
    contactPhone: '+233302674040', status: 'active',
  },
  {
    name: '37 Military Hospital',
    address: 'Liberation Rd, Cantonments, Accra',
    location: { type: 'Point', coordinates: [-0.1773, 5.5962] },
    totalBeds: 500, availableBeds: 45,
    contactPhone: '+233302776111', status: 'active',
  },
  {
    name: 'Ridge Hospital',
    address: 'Castle Rd, Ridge, Accra',
    location: { type: 'Point', coordinates: [-0.2009, 5.5720] },
    totalBeds: 350, availableBeds: 60,
    contactPhone: '+233302665401', status: 'active',
  },
  {
    name: 'Trust Hospital',
    address: 'Liberation Rd, Accra',
    location: { type: 'Point', coordinates: [-0.1923, 5.5893] },
    totalBeds: 120, availableBeds: 25,
    contactPhone: '+233302762441', status: 'active',
  },
];

const POLICE_STATIONS = [
  {
    name: 'Accra Central Police Station',
    address: 'Ring Rd Central, Accra',
    region: 'Greater Accra',
    location: { type: 'Point', coordinates: [-0.2103, 5.5502] },
    contactPhone: '+233302221222', status: 'active',
  },
  {
    name: 'Kaneshie Police Station',
    address: 'Kaneshie, Accra',
    region: 'Greater Accra',
    location: { type: 'Point', coordinates: [-0.2374, 5.5638] },
    contactPhone: '+233302221333', status: 'active',
  },
  {
    name: 'Nima Police Station',
    address: 'Nima, Accra',
    region: 'Greater Accra',
    location: { type: 'Point', coordinates: [-0.2073, 5.5805] },
    contactPhone: '+233302221444', status: 'active',
  },
  {
    name: 'Tema Police Station',
    address: 'Community 1, Tema',
    region: 'Greater Accra',
    location: { type: 'Point', coordinates: [-0.0167, 5.6698] },
    contactPhone: '+233303202212', status: 'active',
  },
];

const FIRE_STATIONS = [
  {
    name: 'Accra Central Fire Station',
    address: 'Ring Rd Central, Accra',
    region: 'Greater Accra',
    location: { type: 'Point', coordinates: [-0.2162, 5.5490] },
    contactPhone: '+233302221440', status: 'active',
  },
  {
    name: 'Kaneshie Fire Station',
    address: 'Kaneshie, Accra',
    region: 'Greater Accra',
    location: { type: 'Point', coordinates: [-0.2354, 5.5683] },
    contactPhone: '+233302221441', status: 'active',
  },
  {
    name: 'Tema Fire Station',
    address: 'Tema Industrial Area, Tema',
    region: 'Greater Accra',
    location: { type: 'Point', coordinates: [-0.0188, 5.6712] },
    contactPhone: '+233303202213', status: 'active',
  },
];

async function seed() {
  const force = process.argv.includes('--force');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await Hospital.countDocuments();
  if (existing > 0 && !force) {
    console.log(`Seed data already present (${existing} hospitals found). Run with --force to overwrite.`);
    return;
  }

  if (force) {
    await Promise.all([
      Hospital.deleteMany(),
      Ambulance.deleteMany(),
      PoliceStation.deleteMany(),
      FireStation.deleteMany(),
    ]);
    console.log('Cleared existing resource data');
  }

  const hospitals = await Hospital.insertMany(HOSPITALS);
  console.log(`✓ Created ${hospitals.length} hospitals`);

  const ambulanceData = [];
  hospitals.forEach((h, i) => {
    ambulanceData.push(
      {
        vehicleNumber: `AMB-${String(i * 2 + 1).padStart(3, '0')}`,
        hospitalId: h._id,
        status: 'available',
        currentLocation: { type: 'Point', coordinates: h.location.coordinates },
      },
      {
        vehicleNumber: `AMB-${String(i * 2 + 2).padStart(3, '0')}`,
        hospitalId: h._id,
        status: 'available',
        currentLocation: { type: 'Point', coordinates: h.location.coordinates },
      }
    );
  });
  await Ambulance.insertMany(ambulanceData);
  console.log(`✓ Created ${ambulanceData.length} ambulances`);

  const policeStations = await PoliceStation.insertMany(POLICE_STATIONS);
  console.log(`✓ Created ${policeStations.length} police stations`);

  const fireStations = await FireStation.insertMany(FIRE_STATIONS);
  console.log(`✓ Created ${fireStations.length} fire stations`);

  console.log('\nSeed complete:');
  console.log(`  Hospitals:       ${hospitals.length}`);
  console.log(`  Ambulances:      ${ambulanceData.length}`);
  console.log(`  Police Stations: ${policeStations.length}`);
  console.log(`  Fire Stations:   ${fireStations.length}`);
}

seed()
  .catch((err) => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => mongoose.disconnect());
