const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const CLINIC_NAME = 'Clínica Dental Sonrisa Perfecta';
const CLINIC_PHONE = process.env.CLINIC_PHONE || '(555) 123-4567';
const CLINIC_EMAIL = process.env.SMTP_USER || 'citas@clinicadental.com';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'sservex@gmail.com';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

async function sendEmail(to, subject, html) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email] SMTP no configurado. Correo simulado para ${to}: ${subject}`);
    return;
  }

  if (!to) return;

  try {
    await transporter.sendMail({
      from: `"${CLINIC_NAME}" <${CLINIC_EMAIL}>`,
      to,
      subject,
      html
    });
    console.log(`[Email] Enviado a ${to}: ${subject}`);
  } catch (error) {
    console.error(`[Email] Error enviando a ${to}:`, error.message);
  }
}

async function sendAppointmentConfirmation(appointment, patient) {
  if (!patient?.email) return;

  const subject = `Cita confirmada - ${CLINIC_NAME}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      <div style="background: #0f4c75; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${CLINIC_NAME}</h1>
        <p style="color: #bbe1fa; margin: 4px 0 0;">Confirmación de Cita</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px;">Hola <strong>${patient.name} ${patient.last_name}</strong>,</p>
        <p style="font-size: 16px;">Tu cita ha sido agendada exitosamente. Aquí están los detalles:</p>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #0f4c75;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Servicio</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${appointment.service_name || 'Consulta'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Fecha</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${formatDate(appointment.date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Hora</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${appointment.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Dentista</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${appointment.dentist_name}</td>
            </tr>
            ${appointment.dentist_specialty ? `
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Especialidad</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${appointment.dentist_specialty}</td>
            </tr>` : ''}
          </table>
        </div>

        <p style="font-size: 14px; color: #666;">Por favor arrive 10 minutos antes de tu cita. Si necesitas cancelar o reprogramar, contactanos con anticipación.</p>
        
        <p style="font-size: 14px; margin-top: 24px;">¿Preguntas? Llámanos: <strong>${CLINIC_PHONE}</strong></p>
      </div>
      <div style="background: #f1f1f1; padding: 16px 24px; text-align: center; font-size: 12px; color: #999;">
        ${CLINIC_NAME} · ${CLINIC_PHONE} · ${CLINIC_EMAIL}
      </div>
    </div>
  `;

  await sendEmail(patient.email, subject, html);
}

async function sendAppointmentCancellation(appointment, patient) {
  if (!patient?.email) return;

  const subject = `Cita cancelada - ${CLINIC_NAME}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      <div style="background: #c0392b; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${CLINIC_NAME}</h1>
        <p style="color: #fadbd8; margin: 4px 0 0;">Cita Cancelada</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px;">Hola <strong>${patient.name} ${patient.last_name}</strong>,</p>
        <p style="font-size: 16px;">Lamentamos informarte que tu cita ha sido <strong>cancelada</strong>.</p>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #c0392b;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Servicio</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${appointment.service_name || 'Consulta'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Fecha</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${formatDate(appointment.date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Hora</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${appointment.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Dentista</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${appointment.dentist_name}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #666;">Si deseas agendar una nueva cita, puedes hacerlo en cualquier momento a través de nuestra página web o llamando a nuestros números de contacto.</p>
        
        <p style="font-size: 14px; margin-top: 24px;">¿Preguntas? Llámanos: <strong>${CLINIC_PHONE}</strong></p>
      </div>
      <div style="background: #f1f1f1; padding: 16px 24px; text-align: center; font-size: 12px; color: #999;">
        ${CLINIC_NAME} · ${CLINIC_PHONE} · ${CLINIC_EMAIL}
      </div>
    </div>
  `;

  await sendEmail(patient.email, subject, html);
}

async function sendAppointmentReschedule(appointment, patient) {
  if (!patient?.email) return;

  const subject = `Cita reprogramada - ${CLINIC_NAME}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      <div style="background: #e67e22; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${CLINIC_NAME}</h1>
        <p style="color: #fdebd0; margin: 4px 0 0;">Cita Reprogramada</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px;">Hola <strong>${patient.name} ${patient.last_name}</strong>,</p>
        <p style="font-size: 16px;">Tu cita ha sido <strong>reprogramada</strong>. Estos son los nuevos datos:</p>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #e67e22;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Servicio</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${appointment.service_name || 'Consulta'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Nueva Fecha</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${formatDate(appointment.date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Nueva Hora</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${appointment.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Dentista</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${appointment.dentist_name}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #666;">Por favor arrive 10 minutos antes de tu nueva cita.</p>
        <p style="font-size: 14px; margin-top: 24px;">¿Preguntas? Llámanos: <strong>${CLINIC_PHONE}</strong></p>
      </div>
      <div style="background: #f1f1f1; padding: 16px 24px; text-align: center; font-size: 12px; color: #999;">
        ${CLINIC_NAME} · ${CLINIC_PHONE} · ${CLINIC_EMAIL}
      </div>
    </div>
  `;

  await sendEmail(patient.email, subject, html);
}

async function sendPasswordResetEmail(user, token, resetUrl) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email] SMTP no configurado. Reset para ${user.email}: ${resetUrl}`);
    return;
  }

  if (!user?.email) return;

  const subject = `Recuperar contraseña - ${CLINIC_NAME}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      <div style="background: #0f4c75; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${CLINIC_NAME}</h1>
        <p style="color: #bbe1fa; margin: 4px 0 0;">Recuperación de contraseña</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px;">Hola <strong>${user.name}</strong>,</p>
        <p style="font-size: 16px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p style="font-size: 14px; color: #666;">Haz clic en el siguiente botón para crear una nueva contraseña. Este enlace expira en <strong>15 minutos</strong>.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #0f4c75; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Restablecer contraseña</a>
        </div>
        
        <p style="font-size: 13px; color: #999; text-align: center;">Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña actual seguirá siendo válida.</p>
        <p style="font-size: 13px; color: #999; text-align: center; margin-top: 8px;">Este enlace expira en 15 minutos.</p>
      </div>
      <div style="background: #f1f1f1; padding: 16px 24px; text-align: center; font-size: 12px; color: #999;">
        ${CLINIC_NAME} · ${CLINIC_PHONE} · ${CLINIC_EMAIL}
      </div>
    </div>
  `;

  await sendEmail(user.email, subject, html);
}

async function sendPasswordChangedEmail(user) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email] SMTP no configurado. Confirmación de cambio de contraseña para ${user.email}`);
    return;
  }

  if (!user?.email) return;

  const subject = `Contraseña actualizada - ${CLINIC_NAME}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      <div style="background: #27ae60; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${CLINIC_NAME}</h1>
        <p style="color: #d5f5e3; margin: 4px 0 0;">Contraseña actualizada</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px;">Hola <strong>${user.name}</strong>,</p>
        <p style="font-size: 16px;">Tu contraseña ha sido cambiada exitosamente.</p>
        <p style="font-size: 14px; color: #666;">Si fuiste tú quien realizó este cambio, no necesitas hacer nada más.</p>
        <p style="font-size: 14px; color: #666; margin-top: 16px;">Si no fuiste tú, contacta inmediatamente a <strong>${CLINIC_PHONE}</strong>.</p>
      </div>
      <div style="background: #f1f1f1; padding: 16px 24px; text-align: center; font-size: 12px; color: #999;">
        ${CLINIC_NAME} · ${CLINIC_PHONE} · ${CLINIC_EMAIL}
      </div>
    </div>
  `;

  await sendEmail(user.email, subject, html);
}

async function sendContactEmail(data) {
  const { name, email, phone, message } = data;
  
  const subject = `Nuevo mensaje de contacto - ${name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      <div style="background: #0f4c75; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${CLINIC_NAME}</h1>
        <p style="color: #bbe1fa; margin: 4px 0 0;">Nuevo mensaje de contacto</p>
      </div>
      <div style="padding: 32px 24px;">
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #0f4c75;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Nombre</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Email</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${email || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Teléfono</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${phone || '-'}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 14px; font-weight: bold; color: #666; margin-bottom: 8px;">Mensaje:</p>
        <p style="font-size: 14px; color: #333; line-height: 1.6;">${message}</p>
        
        <p style="font-size: 13px; color: #999; margin-top: 24px;">Recibido el ${new Date().toLocaleString('es-ES', { timeZone: 'America/Santiago' })}</p>
      </div>
      <div style="background: #f1f1f1; padding: 16px 24px; text-align: center; font-size: 12px; color: #999;">
        ${CLINIC_NAME} · ${CLINIC_PHONE} · ${CLINIC_EMAIL}
      </div>
    </div>
  `;

  await sendEmail(CONTACT_EMAIL, subject, html);
  await sendEmail(email, `Recibimos tu mensaje - ${CLINIC_NAME}`, `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      <div style="background: #27ae60; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${CLINIC_NAME}</h1>
        <p style="color: #d5f5e3; margin: 4px 0 0;">Recibimos tu mensaje</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px;">Hola <strong>${name}</strong>,</p>
        <p style="font-size: 16px;">Recibimos tu mensaje exitosamente. Te responderemos a la brevedad.</p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="font-size: 14px; font-weight: bold; color: #666; margin-bottom: 8px;">Tu mensaje:</p>
          <p style="font-size: 14px; color: #333;">${message}</p>
        </div>
        <p style="font-size: 14px; color: #666;">¿Preguntas? Llámanos: <strong>${CLINIC_PHONE}</strong></p>
      </div>
      <div style="background: #f1f1f1; padding: 16px 24px; text-align: center; font-size: 12px; color: #999;">
        ${CLINIC_NAME} · ${CLINIC_PHONE} · ${CLINIC_EMAIL}
      </div>
    </div>
  `);
}

module.exports = {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendAppointmentReschedule,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendContactEmail
};
