const mongoose = require('mongoose');

const boothAdminSchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: [true, 'Booth reference is required'],
    unique: true,
    example: "507f1f77bcf86cd799439011"
  },
  municipal_ward_no: {
    type: String,
    trim: true,
    example: "Ward 15"
  },
  nearest_landmark: {
    type: String,
    trim: true,
    example: "Near City Mall"
  },
  blo_name: {
    type: String,
    trim: true,
    example: "Sanjay Patel"
  },
  blo_contact: {
    type: String,
    trim: true,
    example: "9876543210"
  },
  police_station: {
    type: String,
    trim: true,
    example: "Hazratganj Police Station"
  },
  created_at: {
    type: Date,
    default: Date.now,
    example: "2023-05-15T10:00:00Z"
  },
  updated_at: {
    type: Date,
    default: Date.now,
    example: "2023-05-15T10:00:00Z"
  }
});

boothAdminSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('BoothAdmin', boothAdminSchema);