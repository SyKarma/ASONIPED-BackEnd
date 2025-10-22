import { db } from '../../../db';
import bcrypt from 'bcrypt';

export interface PasswordResetToken {
  id?: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used?: boolean;
  created_at?: Date;
}

// Crear un nuevo token
export const createToken = async (
  user_id: number,
  token_hash: string,
  expires_at: Date
): Promise<number> => {
  const [result]: any = await db.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [user_id, token_hash, expires_at]
  );
  return result.insertId;
};

// Obtener token válido por token plano
export const getValidTokenByPlainToken = async (
  plainToken: string
): Promise<PasswordResetToken | null> => {
  const [rows]: any = await db.query(
    'SELECT * FROM password_reset_tokens WHERE used = FALSE AND expires_at > NOW()',
    []
  );
  if (!rows || rows.length === 0) return null;
  
  // Buscar el token que coincida con el hash
  for (const row of rows) {
    const isValid = await bcrypt.compare(plainToken, row.token_hash);
    if (isValid) {
      return row as PasswordResetToken;
    }
  }
  return null;
};

// Marcar tokens como usados para un usuario
export const invalidateTokensForUser = async (
  user_id: number
): Promise<void> => {
  await db.query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ?',
    [user_id]
  );
};