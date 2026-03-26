const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendSameDayReminders, sendOneHourReminders } = require('../utils/emailReminderUtils');

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
      console.log(`Scheduler: marked ${result.modifiedCount} past appointment(s) as COMPLETED`);
    }
  } catch (err) {
    console.error('Mark past appointments error:', err.message);
  }
}

function startEmailScheduler() {
  // Every minute — check 1-hour reminders
  cron.schedule('* * * * *', async () => {
    await sendOneHourReminders();
  });

  // Every day at 8:00 AM — same-day reminders
  cron.schedule('0 8 * * *', async () => {
    await sendSameDayReminders();
  });

  // Every day at midnight — mark past appointments as COMPLETED
  cron.schedule('0 0 * * *', async () => {
    await markPastAppointmentsCompleted();
  });

  // Run once on startup to catch any already-past appointments
  markPastAppointmentsCompleted();

  console.log('Email scheduler started');
}

module.exports = { startEmailScheduler };
