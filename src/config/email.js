const nodemailer = require('nodemailer');

// Configuración del transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Enviar email de recordatorio
 */
async function sendReminderEmail(to, habitName, userName) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'habit-tracker@example.com',
      to: to,
      subject: `⏰ Recordatorio: ${habitName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #6366f1; margin-bottom: 20px;">🏆 Habit Tracker</h1>
            <h2 style="color: #1f2937;">¡Hola ${userName}! 👋</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              No olvides completar tu hábito hoy:
            </p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #6366f1;">
              <h3 style="margin: 0; color: #1f2937;">${habitName}</h3>
            </div>
            <a href="${process.env.APP_URL || 'http://localhost:3000'}" 
               style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 10px;">
              Ver mis hábitos
            </a>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              Este es un recordatorio automático de Habit Tracker.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
}

module.exports = { transporter, sendReminderEmail };