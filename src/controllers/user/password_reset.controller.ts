import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import * as UserModel from '../../models/user/user.model';
import * as PasswordResetTokenModel from '../../models/user/password_reset_token.model';
import { EmailService } from '../../services/email.service';

const PASSWORD_COST = 12;
const TOKEN_TTL_MINUTES = 15;
const emailService = new EmailService(); // Instancia global

// POST /users/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { emailOrUsername } = req.body;
  let user = await UserModel.getUserByEmail(emailOrUsername);
  if (!user) user = await UserModel.getUserByUsername(emailOrUsername);

  // Responde 200 siempre para seguridad
  res.status(200).json({ message: 'If the user exists, a reset email was sent.' });
  if (!user || user.status !== 'active') return;

  // Generar token seguro
  const token = emailService.generateResetToken();
  const token_hash = await bcrypt.hash(token, PASSWORD_COST);
  const expires_at = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);
  await PasswordResetTokenModel.createToken(user.id!, token_hash, expires_at);

  // Generar URL
  const resetUrl = emailService.generateResetUrl(token, process.env.FRONTEND_URL);

  // Enviar correo usando el servicio existente
  await emailService.sendPasswordResetEmail({
    to: user.email,
    username: user.username,
    resetToken: token,
    resetUrl,
  });
};

// POST /users/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;
  if (!validatePassword(password)) {
    res.status(422).json({ error: 'Contraseña inválida.' });
    return;
  }
  // Busca token por hash
  const tokens = await PasswordResetTokenModel.getValidTokenByHash(token);
  if (!tokens) {
    res.status(400).json({ error: 'Token inválido.' });
    return;
  }
  if (tokens.expires_at < new Date()) {
    res.status(410).json({ error: 'Token expirado.' });
    return;
  }
  if (tokens.used) {
    res.status(400).json({ error: 'Token ya usado.' });
    return;
  }
  // Verifica el token real
  const valid = await bcrypt.compare(token, tokens.token_hash);
  if (!valid) {
    res.status(400).json({ error: 'Token inválido.' });
    return;
  }
  // Hashea la nueva contraseña
  const password_hash = await bcrypt.hash(password, PASSWORD_COST);
  await UserModel.updateUser(tokens.user_id, { password_hash });
  await PasswordResetTokenModel.invalidateTokensForUser(tokens.user_id);
  res.status(200).json({ message: 'Contraseña actualizada con éxito.' });
};

function validatePassword(password: string): boolean {
  // Ejemplo: mínimo 8 caracteres, una mayúscula, un número
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}