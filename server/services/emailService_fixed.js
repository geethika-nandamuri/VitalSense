const nodemailer = require('nodemailer');

// Debug logging for production
console.log('📧 EMAIL SERVICE INITIALIZATION:');
console.log('  EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');

// Validate environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('❌ EMAIL CONFIGURATION ERROR: EMAIL_USER and EMAIL_PASS must be set in environment variables');
}

// Create transporter with explicit SMTP configuration
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Additional options for production reliability
  pool: true, // use pooled connection
  maxConnections: 5, // limit concurrent connections
  maxMessages: 100, // limit messages per connection
  rateDelta: 20000, // 20 seconds between rate limit resets
  rateLimit: 5, // max 5 messages per rateDelta
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ EMAIL TRANSPORTER VERIFICATION FAILED:', error.message);
    console.error('   Check your EMAIL_USER and EMAIL_PASS credentials');
  } else {
    console.log('✅ EMAIL TRANSPORTER VERIFIED: Ready to send emails');
  }
});

async function sendEmail(to, subject, text) {
  // Validate inputs
  if (!to || !subject || !text) {
    console.error('❌ EMAIL SEND ERROR: Missing required parameters (to, subject, text)');
    return false;
  }

  if (!process.env.EMAIL_USER) {
    console.error('❌ EMAIL SEND ERROR: EMAIL_USER not configured');
    return false;
  }

  try {
    console.log(`📧 SENDING EMAIL:
      From: ${process.env.EMAIL_USER}
      To: ${to}
      Subject: ${subject}
      Environment: ${process.env.NODE_ENV || 'development'}`);

    const info = await transporter.sendMail({
      from: `"VitalSense" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      // Add HTML version for better formatting
      html: text.replace(/\n/g, '<br>')
    });

    console.log('✅ EMAIL SENT SUCCESSFULLY:');
    console.log('  Message ID:', info.messageId);
    console.log('  Response:', info.response);
    
    return true;
  } catch (err) {
    console.error('❌ EMAIL SEND FAILED:');
    console.error('  Error Code:', err.code);
    console.error('  Error Message:', err.message);
    console.error('  Command:', err.command);
    console.error('  Response:', err.response);
    
    // Log specific Gmail/SMTP errors
    if (err.code === 'EAUTH') {
      console.error('  🔐 AUTHENTICATION ERROR: Check EMAIL_USER and EMAIL_PASS');
      console.error('  💡 TIP: Make sure you\'re using an App Password, not your regular Gmail password');
    } else if (err.code === 'ECONNECTION') {
      console.error('  🌐 CONNECTION ERROR: Check network connectivity and SMTP settings');
    } else if (err.code === 'ETIMEDOUT') {
      console.error('  ⏰ TIMEOUT ERROR: SMTP server took too long to respond');
    }
    
    return false;
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📧 Closing email transporter...');
  transporter.close();
});

module.exports = { sendEmail, transporter };