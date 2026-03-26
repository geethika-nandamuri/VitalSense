// In routes/appointments.js - Replace the email sending block with this:

// Send booking confirmation email (non-blocking)
try {
  console.log('📧 CONFIRMATION EMAIL ATTEMPT:');
  console.log('  Patient Email:', req.user.email);
  console.log('  Doctor Name:', doctor.name);
  console.log('  Environment Variables Check:');
  console.log('    EMAIL_USER:', process.env.EMAIL_USER ? '✅ Available' : '❌ Missing');
  console.log('    EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Available' : '❌ Missing');
  
  if (!req.user.email) {
    console.log('📧 CONFIRMATION EMAIL: skipped — no email on patient account');
  } else if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('📧 CONFIRMATION EMAIL: skipped — email credentials not configured');
  } else {
    const emailSent = await sendEmail(
      req.user.email,
      'Appointment Confirmed - VitalSense',
      `Hello ${req.user.name},

Your appointment has been confirmed!

Details:
• Doctor: Dr. ${doctor.name}
• Date: ${appointmentDate.toDateString()}
• Time: ${time}

Thank you for choosing VitalSense.

Best regards,
VitalSense Team`
    );
    
    if (emailSent) {
      console.log('📧 CONFIRMATION EMAIL: sent successfully');
      appointment.confirmationEmailSent = true;
      await appointment.save();
    } else {
      console.error('📧 CONFIRMATION EMAIL: failed to send (check logs above)');
      // Don't fail the appointment booking if email fails
    }
  }
} catch (emailErr) {
  console.error('📧 CONFIRMATION EMAIL ERROR:');
  console.error('  Error:', emailErr.message);
  console.error('  Stack:', emailErr.stack);
  // Don't fail the appointment booking if email fails
}