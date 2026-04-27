const express = require('express');
const ChatBooking = require('../models/ChatBooking');

const router = express.Router();

router.post('/book', async (req, res) => {
  try {
    const { name, date, time, contact } = req.body;

    if (!name || !date || !time || !contact) {
      return res.status(400).json({ error: 'name, date, time, and contact are all required' });
    }

    const booking = await ChatBooking.create({ name, date, time, contact });

    res.status(201).json({
      message: 'Appointment booked successfully!',
      booking
    });
  } catch (error) {
    console.error('Appointment booking error:', error.message);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

module.exports = router;
