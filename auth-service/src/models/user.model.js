const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ROLES = ['system_admin', 'hospital_admin', 'police_admin', 'fire_admin', 'ambulance_driver'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
    },
    // Links user to their station/hospital/ambulance in the Responder Service
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Organization linking for admins (hospital, police station, fire station)
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    organizationType: {
      type: String,
      enum: [null, 'hospital', 'police_station', 'fire_station'],
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
