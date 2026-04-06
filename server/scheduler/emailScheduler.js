const Appointment = require('../models/Appointment');

// Called on server startup to mark already-past appointments as COMPLETED
async function markPastAppointmentsCompleted() {
  try {
    const now = new Date();
    const result = await Appointment.updateMany(
      {
        status: { $in: ['BOOKED', 'CONFIRMED'] },
        date: { $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
      },
      { $set: { status: 'COMPLETED' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Marked ${result.modifiedCount} past appointment(s) as COMPLETED`);
    }
  } catch (err) {
    console.error('markPastAppointmentsCompleted error:', err.message);
  }
}

module.exports = { markPastAppointmentsCompleted };
