import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

// Password reset email data
interface PasswordResetEmail {
  to: string;
  username: string;
  resetToken: string;
  resetUrl: string;
}

// Email verification data
interface EmailVerificationEmail {
  to: string;
  username: string;
  verificationToken: string;
  verificationUrl: string;
}

// Email service class
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Debug: Log the credentials being used
    console.log('🔍 Email Service Constructor Debug:');
    console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
    console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '***SET***' : 'NOT SET'}`);
    console.log(`   SMTP_PASS length: ${process.env.SMTP_PASS?.length || 0}`);
    console.log(`   Frontend URL: http://localhost:5173 (frontend auto-detects IP)`);
    
    // Create transporter with Gmail SMTP configuration
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });
    
    console.log('✅ Transporter created with configuration');
  }

  // Generate secure reset token
  generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Generate reset URL
  generateResetUrl(token: string, baseUrl?: string): string {
    // Use provided baseUrl or default to localhost
    // The frontend will automatically detect and use the correct IP
    const url = baseUrl || 'http://localhost:5173';
    return `${url}/reset-password?token=${token}`;
  }

  // Generate verification token
  generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Generate verification URL
  generateVerificationUrl(token: string, baseUrl?: string): string {
    // Use provided baseUrl or default to localhost
    // The frontend will automatically detect and use the correct IP
    const url = baseUrl || 'http://localhost:5173';
    return `${url}/verify-email?token=${token}`;
  }

  // Send password reset email
  async sendPasswordResetEmail(emailData: PasswordResetEmail): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"ASONIPED" <${process.env.SMTP_USER}>`,
        to: emailData.to,
        subject: 'Recuperación de Contraseña - ASONIPED',
        html: this.getPasswordResetHTMLTemplate(emailData),
        text: this.getPasswordResetTextTemplate(emailData)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      return false;
    }
  }

  // Send email verification
  async sendEmailVerification(emailData: EmailVerificationEmail): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"ASONIPED" <${process.env.SMTP_USER}>`,
        to: emailData.to,
        subject: 'Verificación de Email - ASONIPED',
        html: this.getEmailVerificationHTMLTemplate(emailData),
        text: this.getEmailVerificationTextTemplate(emailData)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email verification sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending email verification:', error);
      return false;
    }
  }

  // HTML email template
  private getPasswordResetHTMLTemplate(emailData: PasswordResetEmail): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña - ASONIPED</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #e2e8f0; 
            margin: 0; 
            padding: 0; 
            background-color: #111827; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #1f2937; 
            border-radius: 12px; 
            overflow: hidden; 
            border: 1px solid #374151; 
          }
          .header { 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600; 
            letter-spacing: 1px; 
          }
          .header p { 
            margin: 10px 0 0 0; 
            font-size: 16px; 
            opacity: 0.9; 
          }
          .content { 
            padding: 40px 30px; 
            background: #1f2937; 
          }
          .greeting { 
            font-size: 20px; 
            color: #f9fafb; 
            margin-bottom: 20px; 
            font-weight: 500; 
          }
          .message { 
            color: #d1d5db; 
            margin-bottom: 30px; 
            font-size: 16px; 
          }
          .button-container { 
            text-align: center; 
            margin: 30px 0; 
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px; 
            transition: all 0.3s ease; 
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4); 
          }
          .button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.6); 
          }
          .warning-box { 
            background: #7f1d1d; 
            border-left: 4px solid #dc2626; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 0 8px 8px 0; 
          }
          .warning-box h3 { 
            margin: 0 0 10px 0; 
            color: #fca5a5; 
            font-size: 16px; 
            font-weight: 600; 
          }
          .warning-box p { 
            margin: 0; 
            color: #fecaca; 
            font-size: 14px; 
          }
          .link-text { 
            background: #374151; 
            border: 1px solid #4b5563; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 20px 0; 
            word-break: break-all; 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            color: #fca5a5; 
          }
          .footer { 
            background: #111827; 
            color: #9ca3af; 
            padding: 30px; 
            text-align: center; 
            font-size: 14px; 
            border-top: 1px solid #374151; 
          }
          .footer p { 
            margin: 5px 0; 
          }
          .logo { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px; 
          }
          .tagline { 
            font-size: 18px; 
            margin-top: 15px; 
            opacity: 0.9; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ASONIPED</div>
            <h1>Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <div class="greeting">Estimado/a ${emailData.username},</div>
            
            <div class="message">
              <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta en ASONIPED.</p>
              
              <p>Para continuar con el proceso de recuperación, haga clic en el siguiente botón:</p>
            </div>

            <div class="button-container">
              <a href="${emailData.resetUrl}" class="button">Restablecer Contraseña</a>
            </div>

            <div class="warning-box">
              <h3>Información de Seguridad:</h3>
              <p>• Este enlace de recuperación es válido por 1 hora</p>
              <p>• Si no solicitó este cambio, puede ignorar este mensaje</p>
              <p>• Por seguridad, recomendamos cambiar su contraseña regularmente</p>
            </div>

            <p style="color: #4a5568; font-size: 14px; margin-top: 25px;">
              Si el botón no funciona, copie y pegue el siguiente enlace en su navegador:
            </p>
            <div class="link-text">${emailData.resetUrl}</div>
          </div>
          <div class="footer">
            <p><strong>© 2024 ASONIPED - Asociación Nicoyana de Personas con Discapacidad</strong></p>
            <p>Este es un mensaje automático generado por nuestro sistema</p>
            <p>Por favor, no responda a este correo electrónico</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Plain text email template
  private getPasswordResetTextTemplate(emailData: PasswordResetEmail): string {
    return `
      ========================================
      RECUPERACIÓN DE CONTRASEÑA - ASONIPED
      ========================================
      
      Estimado/a ${emailData.username},
      
      Hemos recibido una solicitud para restablecer la contraseña de su cuenta en ASONIPED 
      (Asociación Nicoyana de Personas con Discapacidad).
      
      Para continuar con el proceso de recuperación, visite el siguiente enlace:
      ${emailData.resetUrl}
      
      INFORMACIÓN DE SEGURIDAD:
      - Este enlace de recuperación es válido por 1 hora
      - Si no solicitó este cambio, puede ignorar este mensaje
      - Por seguridad, recomendamos cambiar su contraseña regularmente
      
      ========================================
      © 2025 ASONIPED - Asociación Nicoyana de Personas con Discapacidad
      Este es un mensaje automático generado por nuestro sistema
      Por favor, no responda a este correo electrónico
      ========================================
    `;
  }

  // HTML email verification template
  private getEmailVerificationHTMLTemplate(emailData: EmailVerificationEmail): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificación de Cuenta - ASONIPED</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #e2e8f0; 
            margin: 0; 
            padding: 0; 
            background-color: #111827; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #1f2937; 
            border-radius: 12px; 
            overflow: hidden; 
            border: 1px solid #374151; 
          }
          .header { 
            background: linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600; 
            letter-spacing: 1px; 
          }
          .header p { 
            margin: 10px 0 0 0; 
            font-size: 16px; 
            opacity: 0.9; 
          }
          .content { 
            padding: 40px 30px; 
            background: #1f2937; 
          }
          .greeting { 
            font-size: 20px; 
            color: #f9fafb; 
            margin-bottom: 20px; 
            font-weight: 500; 
          }
          .message { 
            color: #d1d5db; 
            margin-bottom: 30px; 
            font-size: 16px; 
          }
          .button-container { 
            text-align: center; 
            margin: 30px 0; 
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px; 
            transition: all 0.3s ease; 
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4); 
          }
          .button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6); 
          }
          .info-box { 
            background: #374151; 
            border-left: 4px solid #3b82f6; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 0 8px 8px 0; 
          }
          .info-box h3 { 
            margin: 0 0 10px 0; 
            color: #f9fafb; 
            font-size: 16px; 
            font-weight: 600; 
          }
          .info-box p { 
            margin: 0; 
            color: #d1d5db; 
            font-size: 14px; 
          }
          .link-text { 
            background: #374151; 
            border: 1px solid #4b5563; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 20px 0; 
            word-break: break-all; 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            color: #60a5fa; 
          }
          .footer { 
            background: #111827; 
            color: #9ca3af; 
            padding: 30px; 
            text-align: center; 
            font-size: 14px; 
            border-top: 1px solid #374151; 
          }
          .footer p { 
            margin: 5px 0; 
          }
          .logo { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px; 
          }
          .tagline { 
            font-size: 18px; 
            margin-top: 15px; 
            opacity: 0.9; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ASONIPED</div>
            <h1>Verificación de Cuenta</h1>
          </div>
          <div class="content">
            <div class="greeting">Estimado/a ${emailData.username},</div>
            
            <div class="message">
              <p>Le damos la bienvenida a ASONIPED. Su registro ha sido recibido exitosamente en nuestra plataforma.</p>
              
              <p>Para completar el proceso de registro y activar su cuenta, es necesario verificar su dirección de correo electrónico.</p>
            </div>

            <div class="button-container">
              <a href="${emailData.verificationUrl}" class="button">Verificar Mi Cuenta</a>
            </div>

            <div class="info-box">
              <h3> Información Importante:</h3>
              <p>• Este enlace de verificación es válido por 24 horas</p>
              <p>• Una vez verificado, podrá acceder a todos los servicios de la plataforma</p>
              <p>• Si no solicitó esta verificación, puede ignorar este mensaje</p>
            </div>
          </div>
          <div class="footer">
            <p><strong>© 2025 ASONIPED - Asociación Nicoyana de Personas con Discapacidad</strong></p>
            <p>Este es un mensaje automático generado por nuestro sistema</p>
            <p>Por favor, no responda a este correo electrónico</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Plain text email verification template
  private getEmailVerificationTextTemplate(emailData: EmailVerificationEmail): string {
    return `
      ========================================
      VERIFICACIÓN DE CUENTA - ASONIPED
      ========================================
      
      Estimado/a ${emailData.username},
      
      Le damos la bienvenida a ASONIPED (Asociación Nicoyana de Personas con Discapacidad).
      
      Su registro ha sido recibido exitosamente en nuestra plataforma. Para completar el proceso 
      de registro y activar su cuenta, es necesario verificar su dirección de correo electrónico.
      
      Para verificar su cuenta, visite el siguiente enlace:
      ${emailData.verificationUrl}
      
      INFORMACIÓN IMPORTANTE:
      - Este enlace de verificación es válido por 24 horas
      - Una vez verificado, podrá acceder a todos los servicios de la plataforma
      - Si no solicitó esta verificación, puede ignorar este mensaje
      
      ========================================
      © 2025 ASONIPED - Asociación Nicoyana de Personas con Discapacidad
      Este es un mensaje automático generado por nuestro sistema
      Por favor, no responda a este correo electrónico
      ========================================
    `;
  }

  // Test email service connection
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection successful');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  // Get service status
  getServiceStatus(): { configured: boolean; host: string; user: string } {
    return {
      configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      host: 'gmail',
      user: process.env.SMTP_USER || ''
    };
  }
}

// Export singleton instance with lazy initialization
let _emailService: EmailService | null = null;

export const emailService = {
  get instance(): EmailService {
    if (!_emailService) {
      _emailService = new EmailService();
    }
    return _emailService;
  }
};
