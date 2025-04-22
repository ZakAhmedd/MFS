const mongoose = require('mongoose');

// Custom validator to ensure the fight date is in the future
const isFutureDate = (date) => {
    return date > Date.now();
  };

const fightSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: String,

  date: { 
    type: Date, 
    required: true, 
    validate: {
      validator: isFutureDate, 
      message: 'The fight date must be in the future' 
    }
  },

  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ],
});

module.exports = mongoose.model('Fight', fightSchema);
