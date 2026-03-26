const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { sendEmail } = require('../services/emailService');

async function sendSameDayReminders() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const appointments = await Appointment.find({
      date: { $gte: startOfDay, $lt: endOfDay },
      sameDayReminderSent: false,
      status: { $nin: ['CANCELLED'] },
    }).populate('patientId', 'name email').populate('doctorId', 'name');

    for (const apt of appointments) {
      const patient = apt.patientId;
      const doctor = apt.doctorId;
      if (!patient?.email) continue;

      await sendEmail(
        patient.email,
        'Appointment Reminder',
        `Hello ${patient.name},\nThis is a reminder that you have an appointment today with Dr. ${doctor.name} at ${apt.timeSlot || apt.time}.\n- VitalSense`
      );

      apt.sameDayReminderSent = true;
      await apt.save();
    }
  } catch (err) {
    console.error('Same-day reminder error:', err.message);
  }
}

async function sendOneHourReminders() {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const appointments = await Appointment.find({
      date: { $gte: startOfDay, $lt: endOfDay },
      oneHourReminderSent: false,
      status: { $nin: ['CANCELLED'] },
    }).populate('patientId', 'name email').populate('doctorId', 'name');

    for (const apt of appointments) {
      const timeStr = apt.timeSlot || apt.time;
      if (!timeStr) continue;

      const [hours, minutes] = timeStr.split(':').map(Number);
      const aptDateTime = new Date(apt.date);
      aptDateTime.setHours(hours, minutes, 0, 0);

      if (aptDateTime > now && aptDateTime <= oneHourLater) {
        const patient = apt.patientId;
        const doctor = apt.doctorId;
        if (!patient?.email) continue;

        await sendEmail(
          patient.email,
          'Appointment Reminder',
          `Hello ${patient.name},\nReminder: Your appointment with Dr. ${doctor.name} is in 1 hour at ${timeStr}.\n- VitalSense`
        );

        apt.oneHourReminderSent = true;
        await apt.save();
      }
    }
  } catch (err) {
    console.error('One-hour reminder error:', err.message);
  }
}

module.exports = { sendSameDayReminders, sendOneHourReminders };
