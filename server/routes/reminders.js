const express = require('express');
const { sendSameDayReminders, sendOneHourReminders } = require('../utils/emailReminderUtils');

const router = express.Router();

// Called by an external scheduler (e.g. cron-job.org) every 30–60 minutes
// Secured with a shared secret passed as a header or query param
router.post('/send', async (req, res) => {
  const secret = req.headers['x-reminder-secret'] || req.query.secret;

  if (!process.env.REMINDER_SECRET || secret !== process.env.REMINDER_SECRET) {
    console.warn('⚠️  /api/reminders/send called with invalid or missing secret');
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  console.log(`\n📅 REMINDER JOB TRIGGERED at ${new Date().toISOString()}`);

  try {
    await sendSameDayReminders();
    await sendOneHourReminders();
    console.log('✅ Reminder job completed\n');
    res.json({ success: true, message: 'Reminders processed', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('❌ Reminder job failed:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
