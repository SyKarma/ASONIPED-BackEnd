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
    let smtpPass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || '';
    const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587');
    const smtpSecure = process.env.SMTP_SECURE === 'true' || false;
    
    // Store original password for logging
    const originalPassword = smtpPass;
    
    // Remove spaces from password (common issue with Gmail App Passwords)
    if (smtpPass) {
      smtpPass = smtpPass.trim().replace(/\s+/g, '');
    }
    
    // Log email service configuration (without password)
    console.log('📧 Email Service Configuration:');
    console.log(`   Host: ${smtpHost}`);
    console.log(`   Port: ${smtpPort}${smtpHost.includes('gmail.com') && smtpPort === 587 ? ' (will use 465 for Railway compatibility)' : ''}`);
    console.log(`   Secure: ${smtpSecure}${smtpHost.includes('gmail.com') && smtpPort === 587 ? ' (will use true for Railway compatibility)' : ''}`);
    console.log(`   User: ${smtpUser || 'NOT SET'}`);
    console.log(`   Password: ${smtpPass ? `***SET*** (${smtpPass.length} chars)` : 'NOT SET'}`);
    
    if (!smtpUser || !smtpPass) {
      console.error('❌ Email service configuration incomplete: SMTP_USER and SMTP_PASS must be set');
    } else if (originalPassword && originalPassword.trim() !== smtpPass) {
      console.warn('⚠️ WARNING: Password contained spaces and was cleaned.');
      console.warn('⚠️ Gmail App Passwords should not have spaces. If authentication fails, ensure SMTP_PASS is a 16-character App Password without spaces.');
    } else if (smtpPass.length !== 16 && smtpHost.includes('gmail.com')) {
      console.warn('⚠️ WARNING: Gmail App Passwords are typically 16 characters long.');
      console.warn('⚠️ If authentication fails, verify that SMTP_PASS is a Gmail App Password, not your regular password.');
    }
    
    // For Railway and cloud environments, prefer port 465 with SSL
    // Railway often blocks port 587, but 465 usually works
    const actualPort = smtpHost.includes('gmail.com') && smtpPort === 587 ? 465 : smtpPort;
    const actualSecure = smtpHost.includes('gmail.com') && smtpPort === 587 ? true : smtpSecure;
    
    if (smtpHost.includes('gmail.com') && smtpPort === 587) {
      console.warn('⚠️ Using port 465 with SSL instead of 587 (TLS) for better Railway compatibility');
    }
    
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: actualPort,
      secure: actualSecure, // true for 465 (SSL), false for 587 (TLS/STARTTLS)
      auth: {
        user: smtpUser,
        pass: smtpPass // Password already cleaned (spaces removed)
      },
      // Connection timeout options (important for Railway and cloud environments)
      connectionTimeout: 10000, // 10 seconds (reduced from 60 for faster failure detection)
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 30000, // 30 seconds
      // Enable STARTTLS for port 587 (if not using SSL on 465)
      requireTLS: !actualSecure && actualPort === 587,
      // Gmail specific options
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates (may be needed for some SMTP servers)
        minVersion: 'TLSv1.2' // Use modern TLS version
      },
      // Debug options (can be enabled for troubleshooting)
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    });
    
    // Store the cleaned password for reference (but don't expose it)
    (this.transporter as any)._smtpPass = smtpPass;
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
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries}...`);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        
        // Skip verification on retries to speed up the process
        if (attempt === 1) {
          console.log('🔍 Verifying email service connection...');
          try {
            await this.transporter.verify();
            console.log('✅ Email service connection verified');
          } catch (verifyError) {
            console.warn('⚠️ Connection verification failed, but attempting to send anyway...');
            // Continue even if verification fails - sometimes sending works even if verify doesn't
          }
        }
        
        const fromEmail = process.env.EMAIL_USER || process.env.SMTP_USER || '';
        if (!fromEmail) {
          throw new Error('SMTP_USER or EMAIL_USER not configured');
        }
        
        const mailOptions = {
          from: `"ASONIPED" <${fromEmail}>`,
          to: emailData.to,
          subject: 'Verificación de Email - ASONIPED',
          html: this.getEmailVerificationHTMLTemplate(emailData),
          text: this.getEmailVerificationTextTemplate(emailData)
        };

        console.log(`📧 Attempting to send verification email to ${emailData.to} (attempt ${attempt}/${maxRetries})...`);
        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email verification sent successfully:', result.messageId);
        console.log(`   Response: ${result.response}`);
        return true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message;
        const errorCode = (error as any)?.code;
        
        console.error(`❌ Error sending email verification (attempt ${attempt}/${maxRetries}):`, errorMessage);
        console.error('   Error code:', errorCode);
        
        // Don't retry on authentication errors
        if (errorCode === 'EAUTH') {
          console.error('❌ Authentication failed. This usually means:');
          console.error('   1. The password is incorrect');
          console.error('   2. Gmail requires an "App Password" instead of your regular password');
          console.error('   3. 2-Step Verification must be enabled in your Google account');
          console.error('   Solution: Generate an App Password at https://myaccount.google.com/apppasswords');
          throw error; // Don't retry auth errors
        }
        
        // Retry connection errors
        if (errorCode === 'ECONNECTION' || errorCode === 'ETIMEDOUT' || errorCode === 'ESOCKET') {
          if (attempt < maxRetries) {
            console.warn(`⚠️ Connection error, will retry (${attempt}/${maxRetries})...`);
            continue; // Retry
          } else {
            console.error('❌ Connection failed after all retries. This usually means:');
            console.error('   1. Railway is blocking outbound SMTP connections');
            console.error('   2. The SMTP server is unreachable');
            console.error('   3. Try changing SMTP_PORT to 465 and SMTP_SECURE to true');
            console.error('   Solution: Consider using a transactional email service like:');
            console.error('   - SendGrid (recommended for Railway) - https://sendgrid.com');
            console.error('   - Mailgun - https://mailgun.com');
            console.error('   - AWS SES - https://aws.amazon.com/ses/');
            console.error('   - Or contact Railway support to allow SMTP outbound connections');
          }
        }
        
        // Don't retry other errors
        if (attempt === maxRetries) {
          if (errorCode === 'EENVELOPE') {
            console.error('❌ Envelope error. Check the recipient email address.');
          }
          throw error;
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('Failed to send email after all retries');
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
  async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log('🔍 Testing email service connection...');
      // Use the existing transporter (it already has proper timeouts configured)
      await this.transporter.verify();
      console.log('✅ Email service connection successful');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as any)?.code;
      console.error('❌ Email service connection failed:', errorMessage);
      console.error('   Error code:', errorCode);
      
      let details: any = {
        code: errorCode,
        message: errorMessage
      };
      
      if (errorCode === 'EAUTH') {
        details = {
          ...details,
          solution: 'Gmail requires an App Password. Generate one at https://myaccount.google.com/apppasswords',
          steps: [
            'Enable 2-Step Verification in your Google account',
            'Go to https://myaccount.google.com/apppasswords',
            'Generate a new app password for "Mail"',
            'Use that password (16 characters) in SMTP_PASS instead of your regular password'
          ]
        };
      } else if (errorCode === 'ECONNECTION' || errorCode === 'ETIMEDOUT' || errorCode === 'ESOCKET') {
        details = {
          ...details,
          solution: 'Railway may be blocking SMTP connections. Try these solutions:',
          steps: [
            'Change SMTP_PORT to 465 and SMTP_SECURE to true in Railway environment variables',
            'Use a transactional email service like SendGrid (recommended for Railway)',
            'Contact Railway support to allow outbound SMTP connections',
            'Or use a cloud email service that provides API access (SendGrid, Mailgun, AWS SES)'
          ],
          railwayNote: 'Railway often blocks port 587. Port 465 with SSL usually works better.'
        };
      }
      
      return { success: false, error: errorMessage, details };
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