import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Generate a unique verification code for diplomas
 */
export function generateVerificationCode(): string {
  return `CPG-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Generate a password reset token
 */
export function generateResetToken(): string {
  return uuidv4();
}

/**
 * Send email using nodemailer
 * Note: This requires SMTP configuration via environment variables
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<void> {
  // For development, we'll use a test account or log to console
  // In production, configure with real SMTP settings
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Aula Virtual CPG" <noreply@colegiodepsicologos.org.gt>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("[Email] Message sent: %s", info.messageId);
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    // In development, don't throw error, just log
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
}

/**
 * Send welcome email with initial password
 */
export async function sendWelcomeEmail(email: string, nombreCompleto: string, numeroColegiado: string, password: string): Promise<void> {
  const subject = "Bienvenido al Aula Virtual - Colegio de Psicólogos de Guatemala";
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2B2E5F;">Bienvenido al Aula Virtual</h2>
      <p>Estimado/a <strong>${nombreCompleto}</strong>,</p>
      
      <p>Su cuenta en el Aula Virtual del Colegio de Psicólogos de Guatemala ha sido creada exitosamente.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Número de Colegiado:</strong> ${numeroColegiado}</p>
        <p><strong>Contraseña temporal:</strong> ${password}</p>
      </div>
      
      <p>Por favor, ingrese al sistema y cambie su contraseña en su primer acceso.</p>
      
      <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
      
      <p>Atentamente,<br>
      <strong>Colegio de Psicólogos de Guatemala</strong></p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, nombreCompleto: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.VITE_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
  
  const subject = "Recuperación de Contraseña - Aula Virtual CPG";
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2B2E5F;">Recuperación de Contraseña</h2>
      <p>Estimado/a <strong>${nombreCompleto}</strong>,</p>
      
      <p>Hemos recibido una solicitud para restablecer su contraseña.</p>
      
      <p>Haga clic en el siguiente enlace para crear una nueva contraseña:</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #D91C7A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Restablecer Contraseña
        </a>
      </div>
      
      <p>Si no solicitó este cambio, puede ignorar este correo.</p>
      
      <p>Este enlace expirará en 24 horas.</p>
      
      <p>Atentamente,<br>
      <strong>Colegio de Psicólogos de Guatemala</strong></p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Send notification email for new course
 */
export async function sendNewCourseNotification(email: string, nombreCompleto: string, cursoTitulo: string): Promise<void> {
  const subject = "Nuevo Curso Disponible - Aula Virtual CPG";
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2B2E5F;">Nuevo Curso Disponible</h2>
      <p>Estimado/a <strong>${nombreCompleto}</strong>,</p>
      
      <p>Nos complace informarle que hay un nuevo curso disponible en el Aula Virtual:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #D91C7A; margin-top: 0;">${cursoTitulo}</h3>
      </div>
      
      <p>Ingrese al Aula Virtual para comenzar su capacitación.</p>
      
      <p>Atentamente,<br>
      <strong>Colegio de Psicólogos de Guatemala</strong></p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Send webinar reminder email
 */
export async function sendWebinarReminder(email: string, nombreCompleto: string, webinarTitulo: string, fechaInicio: Date): Promise<void> {
  const subject = "Recordatorio: Webinar Próximo - Aula Virtual CPG";
  
  const fechaFormateada = fechaInicio.toLocaleString("es-GT", {
    dateStyle: "full",
    timeStyle: "short",
  });
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2B2E5F;">Recordatorio de Webinar</h2>
      <p>Estimado/a <strong>${nombreCompleto}</strong>,</p>
      
      <p>Le recordamos que tiene un webinar próximo:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #D91C7A; margin-top: 0;">${webinarTitulo}</h3>
        <p><strong>Fecha y Hora:</strong> ${fechaFormateada}</p>
      </div>
      
      <p>No olvide conectarse a tiempo para no perderse esta valiosa capacitación.</p>
      
      <p>Atentamente,<br>
      <strong>Colegio de Psicólogos de Guatemala</strong></p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Send diploma ready notification
 */
export async function sendDiplomaNotification(email: string, nombreCompleto: string, cursoTitulo: string): Promise<void> {
  const subject = "Su Diploma está Disponible - Aula Virtual CPG";
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2B2E5F;">¡Felicitaciones!</h2>
      <p>Estimado/a <strong>${nombreCompleto}</strong>,</p>
      
      <p>Nos complace informarle que su diploma está disponible para descarga:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #D91C7A; margin-top: 0;">${cursoTitulo}</h3>
      </div>
      
      <p>Ingrese al Aula Virtual para descargar su diploma.</p>
      
      <p>Atentamente,<br>
      <strong>Colegio de Psicólogos de Guatemala</strong></p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}
