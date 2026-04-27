const mongoose = require('mongoose');

const chatBookingSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    date:    { type: String, required: true },
    time:    { type: String, required: true },
    contact: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatBooking', chatBookingSchema);
