const mongoose = require('mongoose');

const electionYearSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return v.toString().length === 4 && v >= 1900 && v <= 2100;
      },
      message: props => `${props.value} is not a valid year!`
    }
  },
  election_type: {
    type: String,
    enum: ['Assembly', 'Parliament'],
    required: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

electionYearSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('ElectionYear', electionYearSchema);