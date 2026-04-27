const axios = require('axios');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendEmail } = require('./emailService');

const fetchDoctorRoster = async () => {
  const doctors = await User.find(
    { role: 'DOCTOR' },
    'name doctorProfile.specialization doctorProfile.hospitalName doctorProfile.city doctorProfile.timeWindow'
  ).lean();
  console.log('Doctors from DB:', doctors.map(d => d.name));
  return doctors;
};

// Strips "Dr."/"Dr" prefix, escapes regex special chars, then does a
// case-insensitive partial match so "bob", "Bob", "Dr. Bob", "Dr Bob Kumar"
// all resolve to the same document.
const findDoctorByName = async (rawName) => {
  const cleaned = rawName
    .replace(/^dr\.?\s*/i, '')   // remove "Dr." or "Dr" prefix
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex special chars

  console.log('Doctor lookup — raw input:', rawName, '| cleaned:', cleaned);

  const doctor = await User.findOne({
    role: 'DOCTOR',
    name: { $regex: cleaned, $options: 'i' },
  });

  if (doctor) {
    console.log('Doctor found:', doctor.name, doctor._id);
  } else {
    console.warn('Doctor NOT found for cleaned name:', cleaned);
    // Log all doctors to help diagnose mismatches
    const all = await User.find({ role: 'DOCTOR' }, 'name').lean();
    console.warn('All doctors in DB:', all.map(d => d.name));
  }

  return doctor;
};

const formatDoctorRoster = (doctors) => {
  if (!doctors.length) return 'No doctors are currently registered in the system.';
  return doctors
    .map(d => {
      const dp = d.doctorProfile || {};
      const parts = [`Dr. ${d.name}`, dp.specialization, dp.hospitalName, dp.city].filter(Boolean);
      if (dp.timeWindow?.start && dp.timeWindow?.end) {
        parts.push(`available ${dp.timeWindow.start}–${dp.timeWindow.end}`);
      }
      return `- ${parts.join(' | ')}`;
    })
    .join('\n');
};

const buildSystemPrompt = (user, doctorRoster) => {
  const p = user.preferences || {};
  const profile = [
    `Name: ${user.name}`,
    `Email: ${user.email}`,
    user.phoneNumber ? `Phone: ${user.phoneNumber}` : null,
    p.age    ? `Age: ${p.age}`       : null,
    p.gender ? `Gender: ${p.gender}` : null,
    p.diet   ? `Diet: ${p.diet}`     : null,
    p.conditions?.length ? `Conditions: ${p.conditions.join(', ')}` : null,
  ].filter(Boolean).join('\n');

  return `You are VitalSense AI, a personal health assistant.

## User Profile (already on file — do NOT ask for this information again)
${profile}

## Registered Doctors (ONLY suggest doctors from this list — do NOT invent names)
${doctorRoster}

## Rules
- NEVER suggest, mention, or invent doctor names that are not in the list above.
- If the user asks who is available, list ONLY the doctors above.
- If no doctors are listed above, say no doctors are currently available.
- When the user wants to book an appointment, collect ONLY the missing fields: preferred date (YYYY-MM-DD), time slot (HH:MM), and doctor name from the list above.
- Once you have date, time, and doctor info, respond with EXACTLY this JSON block on its own line (no markdown fences):
  BOOK_APPOINTMENT:{"date":"YYYY-MM-DD","time":"HH:MM","doctorName":"<exact name from list>"}
- After the JSON line, add a friendly confirmation message.
- Use the user's name naturally in responses.
- Keep answers concise and health-focused.`;
};

const chat = async (userMessage, user, history = []) => {
  try {
    const doctors = await fetchDoctorRoster();
    const doctorRoster = formatDoctorRoster(doctors);
    const systemPrompt = buildSystemPrompt(user, doctorRoster);

    const historyMessages = history.map(m => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }));

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: userMessage },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const rawReply = response.data.choices[0].message.content;

    // Detect booking intent marker emitted by the LLM
    const bookingMatch = rawReply.match(/BOOK_APPOINTMENT:(\{[^\n]+\})/);
    if (bookingMatch) {
      let bookingData;
      try {
        bookingData = JSON.parse(bookingMatch[1]);
      } catch {
        console.error('LLM booking JSON parse error:', bookingMatch[1]);
        return { reply: rawReply.replace(/BOOK_APPOINTMENT:\{[^\n]+\}\n?/, '').trim() };
      }

      const { date, time, doctorName } = bookingData;
      console.log('\n=== CHATBOT BOOKING ATTEMPT ===');
      console.log('Patient:', user._id, user.email);
      console.log('Requested:', { date, time, doctorName });

      // Find doctor — strips "Dr." prefix and does partial case-insensitive match
      const doctor = await findDoctorByName(doctorName);

      if (!doctor) {
        return { reply: `I couldn't find a doctor matching "${doctorName}" in our system. Please visit the Appointments page to book manually.` };
      }

      const appointmentDate = new Date(date);
      appointmentDate.setHours(0, 0, 0, 0);

      // Check for double booking
      const existing = await Appointment.findOne({
        doctorId: doctor._id,
        date: appointmentDate,
        time,
        status: { $in: ['BOOKED', 'CONFIRMED'] },
      });

      if (existing) {
        return { reply: `Sorry, the ${time} slot on ${date} with Dr. ${doctor.name} is already taken. Would you like a different time?` };
      }

      try {
        // Combine date + time into a precise DateTime (mirrors manual booking route)
        const appointmentDateTime = new Date(`${date}T${time}:00`);
        if (isNaN(appointmentDateTime.getTime())) {
          return { reply: `Invalid date or time format. Please try again.` };
        }
        const appointmentDate = new Date(appointmentDateTime);
        appointmentDate.setHours(0, 0, 0, 0);

        const appointment = new Appointment({
          patientId: user._id,
          doctorId: doctor._id,
          date: appointmentDateTime,
          time,
          reason: 'Booked via chat',
          status: 'BOOKED',
        });
        await appointment.save();
        console.log('\u2705 Chatbot appointment saved:', appointment._id);

        // Send confirmation email — same logic as manual booking route
        try {
          console.log('\ud83d\udce7 CHATBOT CONFIRMATION EMAIL ATTEMPT:');
          console.log('   Sending to:', user.email);
          console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '\u2705 Set' : '\u274c Missing');
          console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '\u2705 Set' : '\u274c Missing');

          if (!user.email) {
            console.log('\ud83d\udce7 CHATBOT EMAIL: skipped \u2014 no email on patient account');
          } else if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('\ud83d\udce7 CHATBOT EMAIL: skipped \u2014 email credentials not configured');
          } else {
            const emailSent = await sendEmail(
              user.email,
              'Appointment Confirmed - VitalSense',
              `Hello ${user.name},\n\nYour appointment has been confirmed!\n\nDetails:\n\u2022 Doctor: Dr. ${doctor.name}\n\u2022 Date: ${appointmentDate.toDateString()}\n\u2022 Time: ${time}\n\nThank you for choosing VitalSense.\n\nBest regards,\nVitalSense Team`
            );
            if (emailSent) {
              console.log('\ud83d\udce7 CHATBOT EMAIL: sent successfully');
              appointment.confirmationEmailSent = true;
              await appointment.save();
            } else {
              console.error('\ud83d\udce7 CHATBOT EMAIL: failed to send');
            }
          }
        } catch (emailErr) {
          // Email failure must never block the booking confirmation
          console.error('\ud83d\udce7 CHATBOT EMAIL ERROR:', emailErr.message);
        }

        const friendlyReply = rawReply.replace(/BOOK_APPOINTMENT:\{[^\n]+\}\n?/, '').trim();
        return {
          reply: friendlyReply || `Your appointment with Dr. ${doctor.name} on ${date} at ${time} has been confirmed! \u2705`,
          appointmentId: appointment._id,
        };
      } catch (dbErr) {
        console.error('Chatbot DB save error:', dbErr.message);
        if (dbErr.code === 11000) {
          return { reply: `That slot is already booked. Please choose a different time.` };
        }
        return { reply: 'I was unable to save your appointment due to a system error. Please try again or use the Appointments page.' };
      }
    }

    return { reply: rawReply };
  } catch (error) {
    console.error('LLM service error:', error.response?.data || error.message);
    return { reply: 'Sorry, I am unable to respond right now. Please try again later.' };
  }
};

module.exports = { chat };
