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
    // Create transporter with Gmail SMTP configuration
    // Support both SMTP_* (legacy) and EMAIL_* (new) variable names
    const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER || '';
    const smtpPass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || '';
    
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  // Generate secure reset token
  generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Generate reset URL
  generateResetUrl(token: string, baseUrl?: string): string {
    // Use provided baseUrl, FRONTEND_URL env var, or default to localhost for development
    const url = baseUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${url}/reset-password?token=${token}`;
  }

  // Generate verification token
  generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Generate verification URL
  generateVerificationUrl(token: string, baseUrl?: string): string {
    // Use provided baseUrl, FRONTEND_URL env var, or default to localhost for development
    const url = baseUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${url}/verify-email?token=${token}`;
  }

  // Send password reset email
  async sendPasswordResetEmail(emailData: PasswordResetEmail): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"ASONIPED" <${process.env.EMAIL_USER || process.env.SMTP_USER || ''}>`,
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
        from: `"ASONIPED" <${process.env.EMAIL_USER || process.env.SMTP_USER || ''}>`,
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
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: #0ea5e9;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
        }
        .message {
            color: #666;
            margin-bottom: 25px;
            font-size: 14px;
        }
        .warning-box {
            background: #E6E6FA;
            border: 1px solid #E6E6FA;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .warning-box h3 {
            margin: 0 0 10px 0;
            color: #4169E1;
            font-size: 16px;
            font-weight: bold;
        }
        .warning-box p {
            margin: 0;
            color: #4169E1;
            font-size: 14px;
        }
        .button-container {
            text-align: center;
            margin: 25px 0;
        }
        .button {
            display: inline-block;
            background: #0ea5e9;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
        }
        .instructions {
            margin-top: 25px;
        }
        .instructions h3 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 16px;
            font-weight: bold;
        }
        .instructions ol {
            margin: 0;
            padding-left: 20px;
            color: #666;
            font-size: 14px;
        }
        .instructions li {
            margin-bottom: 5px;
        }
        .footer {
            background: #f8f9fa;
            color: #666;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 3px 0;
        }
        .footer a {
            color: #dc2626;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background: #e9ecef;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ASONIPED</h1>
            <p>Asociación Nicoyana de Personas con Discapacidad</p>
        </div>
        
        <div class="content">
            <div class="title">Recuperación de Contraseña</div>
            
            <div class="message">
                Estimado/a ${emailData.username},<br><br>
                Hemos recibido una solicitud para restablecer la contraseña de su cuenta en ASONIPED. Para continuar con el proceso de recuperación, utilice el siguiente enlace.
            </div>

            <div class="warning-box">
                <h3>Importante:</h3>
                <p>Por motivos de seguridad, este enlace de recuperación es válido por 1 hora. Si no solicitó este cambio, puede ignorar este mensaje.</p>
            </div>

            <div class="button-container">
                <a href="${emailData.resetUrl}" class="button">Restablecer Contraseña</a>
            </div>

            <div class="instructions">
                <h3>Instrucciones de recuperación</h3>
                <ol>
                    <li>Haga clic en el botón de recuperación anterior</li>
                    <li>Ingrese su nueva contraseña en el formulario</li>
                    <li>Confirme su nueva contraseña</li>
                </ol>
            </div>

            <div class="divider"></div>

            <p style="color: #666; font-size: 12px; margin: 0;">
                <strong>Seguridad:</strong> Por seguridad, recomendamos cambiar su contraseña regularmente y usar una contraseña segura.
            </p>
        </div>

        <div class="footer">
            <div class="divider"></div>
            <p>ASONIPED - Asociación Nicoyana de Personas con Discapacidad</p>
            <p>Este es un mensaje automático del sistema. Por favor no responda a este email.</p>
            <p>© 2025 ASONIPED. Todos los derechos reservados.</p>
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
          <title>Verificación de Email - ASONIPED</title>
          <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                background: #0ea5e9;
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: bold;
            }
            .header p {
                margin: 5px 0 0 0;
                font-size: 14px;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .title {
                font-size: 20px;
                font-weight: bold;
                color: #333;
                margin-bottom: 15px;
            }
            .message {
                color: #666;
                margin-bottom: 25px;
                font-size: 14px;
            }
            .warning-box {
                background: #E6E6FA;
                border: 1px solid #E6E6FA;
                border-radius: 6px;
                padding: 20px;
                margin: 20px 0;
            }
            .warning-box h3 {
                margin: 0 0 10px 0;
                color: #4169E1;
                font-size: 16px;
                font-weight: bold;
            }
            .warning-box p {
                margin: 0;
                color: #4169E1;
                font-size: 14px;
            }
            .button-container {
                text-align: center;
                margin: 25px 0;
            }
            .button {
                display: inline-block;
                background: #0ea5e9;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 14px;
            }
            .instructions {
                margin-top: 25px;
            }
            .instructions h3 {
                margin: 0 0 10px 0;
                color: #333;
                font-size: 16px;
                font-weight: bold;
            }
            .instructions ol {
                margin: 0;
                padding-left: 20px;
                color: #666;
                font-size: 14px;
            }
            .instructions li {
                margin-bottom: 5px;
            }
            .footer {
                background: #f8f9fa;
                color: #666;
                padding: 20px 30px;
                text-align: center;
                font-size: 12px;
                border-top: 1px solid #e9ecef;
            }
            .footer p {
                margin: 3px 0;
            }
            .footer a {
                color: #dc2626;
                text-decoration: none;
            }
            .divider {
                height: 1px;
                background: #e9ecef;
                margin: 20px 0;
            }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>ASONIPED</h1>
                  <p>Asociación Nicoyana de Personas con Discapacidad</p>
              </div>
              
              <div class="content">
                  <div class="title">Verificación de Email</div>
                  
                  <div class="message">
                      Estimado/a ${emailData.username},<br><br>
                      Su cuenta en la plataforma ASONIPED ha sido creada exitosamente. Para completar el proceso de registro y activar su cuenta, es necesario verificar su dirección de correo electrónico.
                  </div>

                  <div class="info-box">
                      <h3>Información de acceso</h3>
                      <p><strong>Usuario:</strong> ${emailData.to}</p>
                      <p><strong>Estado:</strong> Pendiente de verificación</p>
                  </div>

                  <div class="button-container">
                      <a href="${emailData.verificationUrl}" class="button">Verificar Mi Cuenta</a>
                  </div>

                  <div class="instructions">
                      <h3>Instrucciones de verificación</h3>
                      <ol>
                          <li>Haga clic en el botón de verificación anterior</li>
                          <li>Será redirigido a la plataforma ASONIPED</li>
                          <li>Su cuenta será activada automáticamente</li>
                      </ol>
                  </div>

                  <div class="divider"></div>

                  <p style="color: #666; font-size: 12px; margin: 0;">
                      <strong>Importante:</strong> Este enlace de verificación es válido por 24 horas. Si no solicitó esta verificación, puede ignorar este mensaje.
                  </p>
              </div>

              <div class="footer">
                  <div class="divider"></div>
                  <p>ASONIPED - Asociación Nicoyana de Personas con Discapacidad</p>
                  <p>Este es un mensaje automático del sistema. Por favor no responda a este email.</p>
                  <p>© 2025 ASONIPED. Todos los derechos reservados.</p>
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
      configured: !!((process.env.EMAIL_USER || process.env.SMTP_USER) && (process.env.EMAIL_PASSWORD || process.env.SMTP_PASS)),
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'gmail',
      user: process.env.EMAIL_USER || process.env.SMTP_USER || ''
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