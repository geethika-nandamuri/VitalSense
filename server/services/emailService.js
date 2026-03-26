const nodemailer = require('nodemailer');

// Production-ready SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Additional production settings
  pool: true, // use pooled connection
  maxConnections: 5, // limit concurrent connections
  maxMessages: 100, // limit messages per connection
  rateDelta: 20000, // 20 seconds between rate limit resets
  rateLimit: 5, // max 5 messages per rateDelta
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ EMAIL TRANSPORTER VERIFICATION FAILED:');
    console.error('   Error:', error.message);
    console.error('   Check EMAIL_USER and EMAIL_PASS environment variables');
    if (error.code === 'EAUTH') {
      console.error('   💡 TIP: Make sure you\'re using a Gmail App Password, not your regular password');
    }
  } else {
    console.log('✅ EMAIL TRANSPORTER VERIFIED: Ready to send emails');
  }
});

async function sendEmail(to, subject, text) {
  // Input validation
  if (!to || !subject || !text) {
    console.error('❌ EMAIL SEND ERROR: Missing required parameters (to, subject, text)');
    return false;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL SEND ERROR: EMAIL_USER or EMAIL_PASS not configured');
    return false;
  }

  try {
    console.log(`📧 SENDING EMAIL:`);
    console.log(`   From: ${process.env.EMAIL_USER}`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

    const info = await transporter.sendMail({
      from: `"VitalSense" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: text.replace(/\n/g, '<br>') // Convert line breaks to HTML
    });

    console.log('✅ EMAIL SENT SUCCESSFULLY:');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    
    return true;
  } catch (err) {
    console.error('❌ EMAIL SEND FAILED:');
    console.error('   Error Code:', err.code);
    console.error('   Error Message:', err.message);
    
    // Detailed error logging for common issues
    if (err.code === 'EAUTH') {
      console.error('   🔐 AUTHENTICATION ERROR: Invalid EMAIL_USER or EMAIL_PASS');
      console.error('   💡 SOLUTION: Use Gmail App Password instead of regular password');
    } else if (err.code === 'ECONNECTION') {
      console.error('   🌐 CONNECTION ERROR: Cannot connect to SMTP server');
      console.error('   💡 SOLUTION: Check network connectivity and firewall settings');
    } else if (err.code === 'ETIMEDOUT') {
      console.error('   ⏰ TIMEOUT ERROR: SMTP server took too long to respond');
      console.error('   💡 SOLUTION: Try again or check server load');
    } else if (err.code === 'EENVELOPE') {
      console.error('   📧 ENVELOPE ERROR: Invalid sender or recipient email');
      console.error('   💡 SOLUTION: Check email addresses are valid');
    }
    
    console.error('   Full Error:', err);
    return false;
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📧 Closing email transporter...');
  transporter.close();
});

module.exports = { sendEmail };
