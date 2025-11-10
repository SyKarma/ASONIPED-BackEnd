import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as UserModel from '../models/user.model';
import { emailService } from '../../../services/email.service';
import { sessionService } from '../../../services/session.service';
import { db } from '../../../db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Register new user
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, full_name, phone, roles } = req.body;

    // Basic validations
    if (!username || !email || !password || !full_name) {
      res.status(400).json({ error: 'All required fields are mandatory' });
      return;
    }
    // Validaciones personalizadas
    
    // Validar que el nombre de usuario solo contenga letras y tenga máximo 15 caracteres
    if (!/^[A-Za-z]{1,15}$/.test(username)) {
      res.status(400).json({ error: 'El usuario solo debe contener letras y máximo 15 caracteres.' });
      return;
    }
    // Validar formato de correo electrónico
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Debe ingresar un correo electrónico válido.' });
      return;
    }
    // Validar que el nombre completo tenga al menos dos palabras
    if (!/^([A-Za-zÁÉÍÓÚáéíóúÑñ]+(\s+|$)){2,}$/.test(full_name.trim())) {
      res.status(400).json({ error: 'Debe ingresar un nombre completo válido (al menos dos palabras).' });
      return;
    }
    // Validar que el teléfono tenga exactamente 8 dígitos
    if (!/^[0-9]{8}$/.test(phone)) {
      res.status(400).json({ error: 'El teléfono debe tener exactamente 8 dígitos.' });
      return;
    }
    // Validar que el teléfono no comience con 0 o 1
    if (!/^[A-Za-z0-9]{6,20}$/.test(password)) {
      res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres y máximo 20 caracteres y solo letras y números.' });
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.getUserByUsername(username);
    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    const existingEmail = await UserModel.getUserByEmail(email);
    if (existingEmail) {
      res.status(400).json({ error: 'Email is already registered' });
      return;
    }

    // Encrypt password
    const passwordHash = await UserModel.hashPassword(password);

    // Create user
    const userId = await UserModel.createUser({
      username,
      email,
      password_hash: passwordHash,
      full_name,
      phone,
      status: 'active'
    });

    // Assign roles if provided
    if (roles && Array.isArray(roles)) {
      for (const role of roles) {
        try {
          await UserModel.assignRoleToUser(userId, role);
        } catch (error) {
          console.error(`Error assigning role ${role}:`, error);
        }
      }
    } else {
      // Assign default basic role
      await UserModel.assignRoleToUser(userId, 'user');
    }

    // Get user with roles
    const userWithRoles = await UserModel.getUserWithRoles(userId);

    // Send verification email (REQUIRED - registration fails if email cannot be sent)
    let emailSent = false;
    try {
      // Check if email service is configured
      const emailStatus = emailService.instance.getServiceStatus();
      if (!emailStatus.configured) {
        console.error('❌ Email service not configured. Cannot send verification email.');
        throw new Error('Email service is not configured. Please configure SMTP_USER and SMTP_PASS environment variables.');
      }
      
      const verificationToken = emailService.instance.generateVerificationToken();
      const verificationUrl = emailService.instance.generateVerificationUrl(verificationToken);
      
      // Store verification token in database
      await UserModel.storeVerificationToken(userId, verificationToken);
      
      console.log(`📧 Sending verification email to ${email} for user ${username}...`);
      emailSent = await emailService.instance.sendEmailVerification({
        to: email,
        username: username,
        verificationToken: verificationToken,
        verificationUrl: verificationUrl
      });
      
      if (!emailSent) {
        throw new Error('Failed to send verification email');
      }
      
      console.log(`✅ Verification email sent successfully to ${email}`);
    } catch (emailError) {
      const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
      console.error('❌ CRITICAL: Error sending verification email:', errorMessage);
      
      // Delete the user since we cannot send verification email
      try {
        await UserModel.deleteUser(userId);
        console.log(`⚠️ User ${username} deleted due to email service failure`);
      } catch (deleteError) {
        console.error('❌ Error deleting user after email failure:', deleteError);
      }
      
      // Return error to user
      res.status(500).json({ 
        error: 'Error sending verification email. Please contact support.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
      return;
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: userWithRoles?.id,
        username: userWithRoles?.username,
        email: userWithRoles?.email,
        full_name: userWithRoles?.full_name,
        roles: userWithRoles?.roles
      }
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Error registering user' });
  }
};

// Recent activities for user (includes Record module events)
export const getUserActivitiesFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const limit = parseInt((req.query.limit as string) || '5');
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Pull latest records where user is creator or current owner
    const [rows] = await db.query(
      `SELECT r.id, r.record_number, r.status, r.created_at, r.updated_at
       FROM records r
       WHERE r.created_by = ? OR (r.handed_over_to_user = TRUE AND r.handed_over_to = ?)
       ORDER BY COALESCE(r.updated_at, r.created_at) DESC
       LIMIT ?`,
      [userId, userId, limit]
    ) as [any[], any];

    const activities = (rows || []).map((r) => {
      const ts = (r.updated_at || r.created_at || new Date());
      const d = new Date(ts);
      const isoDate = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      const normalizedStatus: 'pending' | 'approved' | 'completed' | 'rejected' | 'open' | 'closed' | 'archived' | 'enrolled' | 'registered' | 'cancelled' =
        r.status === 'active' ? 'completed' :
        r.status === 'approved' ? 'approved' :
        r.status === 'rejected' ? 'rejected' : 'pending';
      return {
        id: String(r.id),
        title: r.record_number ? `Expediente ${r.record_number}` : `Expediente #${r.id}`,
        type: 'record' as const,
        date: isoDate.slice(0,10),
        time: isoDate.slice(11,19),
        status: normalizedStatus,
        description: r.updated_at ? 'Expediente actualizado' : 'Expediente creado'
      };
    });

    res.json(activities);
  } catch (err) {
    console.error('Error getting user activities feed:', err);
    res.status(500).json({ error: 'Error getting activities' });
  }
};

// User login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Search user by username or email
    let user = await UserModel.getUserByUsername(username);
    if (!user) {
      user = await UserModel.getUserByEmail(username);
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await UserModel.verifyPassword(password, user.password_hash!);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if user is active
    if (user.status !== 'active') {
      res.status(401).json({ error: 'Inactive account' });
      return;
    }

    // Check if email is verified
    if (!user.email_verified) {
      res.status(401).json({ 
        error: 'Please verify your email before logging in. Check your inbox for the verification link.' 
      });
      return;
    }

    // Get user roles
    const roles = await UserModel.getUserRoles(user.id!);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roles: roles
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set active session (this will invalidate any previous sessions)
    sessionService.setActiveSession(user.id!, token);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        roles: roles
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Error during login' });
  }
};

// User logout
export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Try to get userId from token if available
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    let userId: number | undefined;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { 
          userId?: number; 
          id?: number 
        };
        userId = decoded.userId || decoded.id;
      } catch (tokenError) {
        // Token is invalid, but we still want to allow logout
      }
    }
    
    if (userId) {
      // Only remove session if this token matches the active session
      const activeSession = sessionService.getActiveSession(userId);
      if (activeSession && activeSession.token === token) {
        // This is the active session, safe to remove
        sessionService.removeActiveSession(userId);
      }
    }

    res.json({ message: 'Logout successful' });
  } catch (err) {
    console.error('Error during logout:', err);
    res.status(500).json({ error: 'Error during logout' });
  }
};

// Validate session (simple endpoint for route protection)
export const validateSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { 
        userId?: number; 
        id?: number 
      };
      
      const userId = decoded.userId || decoded.id;
      
      if (!userId) {
        res.status(401).json({ message: 'Invalid token: No user ID' });
        return;
      }

      // Check if this token is the active session for this user
      const isValid = sessionService.isTokenValid(userId, token);
      
      if (!isValid) {
        res.status(401).json({ 
          message: 'Session invalidated. Please log in again.',
          code: 'SESSION_INVALIDATED'
        });
        return;
      }

      res.json({ valid: true, userId });
    } catch (tokenError) {
      res.status(401).json({ message: 'Invalid token' });
    }
  } catch (err) {
    console.error('Error during session validation:', err);
    res.status(500).json({ error: 'Error during session validation' });
  }
};

// Get current user profile
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const user = await UserModel.getUserWithRoles(userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        roles: user.roles
      }
    });
  } catch (err) {
    console.error('Error getting user profile:', err);
    res.status(500).json({ error: 'Error getting user profile' });
  }
};

// Me endpoints (thin wrappers with simpler payloads for frontend PerfilPage)
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const user = await UserModel.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ id: user.id, username: user.username, name: user.full_name, email: user.email, phone: user.phone });
  } catch (err) {
    res.status(500).json({ error: 'Error getting current user' });
  }
};

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const { name, email, phone } = req.body as { name?: string; email?: string; phone?: string | null };

    const updateData: any = {};
    if (name && name.trim()) updateData.full_name = name.trim();
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) {
      // basic validation: allow empty/null or 8-20 digits (adjust to your locale)
      if (phone && !/^\+?[0-9\s-]{8,20}$/.test(phone)) {
        res.status(400).json({ error: 'Invalid phone format' });
        return;
      }
      updateData.phone = phone || null;
    }

    // If email provided, ensure uniqueness
    if (email) {
      const existing = await UserModel.getUserByEmail(email);
      if (existing && existing.id !== userId) {
        res.status(400).json({ error: 'Email is already in use' });
        return;
      }
    }

    await UserModel.updateUser(userId, updateData);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating profile' });
  }
};

export const changeMyPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }
    const user = await UserModel.getUserById(userId);
    if (!user || !user.password_hash) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const ok = await UserModel.verifyPassword(currentPassword, user.password_hash);
    if (!ok) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }
    const newHash = await UserModel.hashPassword(newPassword);
    await UserModel.updateUser(userId, { password_hash: newHash });
    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ error: 'Error changing password' });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { full_name, phone, email } = req.body;

    // Check if email already exists (if being changed)
    if (email) {
      const existingUser = await UserModel.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        res.status(400).json({ error: 'Email is already in use' });
        return;
      }
    }

    // Update user data
    const updateData: any = {};
    if (full_name) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (email) updateData.email = email;

    await UserModel.updateUser(userId, updateData);

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Error updating profile' });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    // Get current user
    const user = await UserModel.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isValidPassword = await UserModel.verifyPassword(currentPassword, user.password_hash!);
    if (!isValidPassword) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    // Encrypt new password
    const newPasswordHash = await UserModel.hashPassword(newPassword);

    // Update password
    await UserModel.updateUser(userId, { password_hash: newPasswordHash });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Error changing password' });
  }
};

// Assign role to user (admin only)
export const assignRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      res.status(400).json({ error: 'User ID and role name are required' });
      return;
    }

    await UserModel.assignRoleToUser(userId, roleName);

    res.json({ message: 'Role assigned successfully' });
  } catch (err) {
    console.error('Error assigning role:', err);
    res.status(500).json({ error: 'Error assigning role' });
  }
};

// Remove role from user (admin only)
export const removeRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      res.status(400).json({ error: 'User ID and role name are required' });
      return;
    }

    await UserModel.removeRoleFromUser(userId, roleName);

    res.json({ message: 'Role removed successfully' });
  } catch (err) {
    console.error('Error removing role:', err);
    res.status(500).json({ error: 'Error removing role' });
  }
}; 

// Get all users (admin only) with pagination, filtering, and sorting
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as 'active' | 'inactive' | undefined;
    const emailVerified = req.query.email_verified === 'true' ? true : req.query.email_verified === 'false' ? false : undefined;
    const role = req.query.role as string | undefined;
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;
    const sortField = req.query.sortField as 'id' | 'username' | 'email' | 'full_name' | 'created_at' | 'status' | undefined;
    const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';

    const filters: UserModel.UserFilters = {};
    if (search) filters.search = search;
    if (status) filters.status = status;
    if (emailVerified !== undefined) filters.email_verified = emailVerified;
    if (role) filters.role = role;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    const sort: UserModel.UserSort | undefined = sortField ? { field: sortField, order: sortOrder } : undefined;

    const result = await UserModel.getAllUsers(filters, sort, page, limit);
    res.json(result);
  } catch (err) {
    console.error('Error getting all users:', err);
    res.status(500).json({ error: 'Error getting users' });
  }
};

// Get user by ID with details (admin only)
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await UserModel.getUserWithRoles(Number(id));
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get additional user statistics
    const [recordsCount] = await db.query('SELECT COUNT(*) as count FROM records WHERE created_by = ?', [id]);
    const [ticketsCount] = await db.query('SELECT COUNT(*) as count FROM donation_tickets WHERE user_id = ?', [id]);
    const [workshopsCount] = await db.query('SELECT COUNT(*) as count FROM workshop_enrollments WHERE user_id = ? AND status = "enrolled"', [id]);
    const [volunteersCount] = await db.query('SELECT COUNT(*) as count FROM volunteer_registrations WHERE user_id = ? AND status = "registered"', [id]);

    res.json({
      ...user,
      statistics: {
        records: (recordsCount as any[])[0]?.count || 0,
        tickets: (ticketsCount as any[])[0]?.count || 0,
        workshops: (workshopsCount as any[])[0]?.count || 0,
        volunteers: (volunteersCount as any[])[0]?.count || 0
      }
    });
  } catch (err) {
    console.error('Error getting user by ID:', err);
    res.status(500).json({ error: 'Error getting user' });
  }
};

// Get users eligible for handover (non-admins without any record)
export const getEligibleUsersForHandover = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.full_name, u.email
       FROM users u
       WHERE u.status = 'active'
         AND NOT EXISTS (
           SELECT 1
           FROM user_role_assignments ura
           JOIN user_roles ur ON ur.id = ura.role_id
           WHERE ura.user_id = u.id AND ur.name = 'admin'
         )
         AND NOT EXISTS (
           SELECT 1
           FROM records r
           WHERE r.created_by = u.id
              OR (r.handed_over_to_user = TRUE AND r.handed_over_to = u.id)
         )
       ORDER BY (u.full_name IS NULL), u.full_name, u.username`
    ) as [any[], any];

    res.json(rows);
  } catch (err) {
    console.error('Error getting eligible users for handover:', err);
    res.status(500).json({ error: 'Error getting eligible users' });
  }
};

// Create new user (admin only)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email, full_name, phone, status, roles } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Debe ingresar un correo electrónico válido.' });
      return;
    }

    // Validate full_name if provided
    if (full_name && !/^([A-Za-zÁÉÍÓÚáéíóúÑñ]+(\s+|$)){2,}$/.test(full_name.trim())) {
      res.status(400).json({ error: 'Debe ingresar un nombre completo válido (al menos dos palabras).' });
      return;
    }

    // Validate phone if provided
    if (phone && !/^[0-9]{8}$/.test(phone)) {
      res.status(400).json({ error: 'El teléfono debe tener exactamente 8 dígitos.' });
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.getUserByUsername(username);
    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await UserModel.getUserByEmail(email);
      if (existingEmail) {
        res.status(400).json({ error: 'Email is already registered' });
        return;
      }
    }

    // Encrypt password
    const passwordHash = await UserModel.hashPassword(password);

    // Create user
    const userId = await UserModel.createUser({
      username,
      email: email || `${username}@asoniped.com`,
      password_hash: passwordHash,
      full_name: full_name || username,
      phone: phone || null,
      status: status || 'active'
    });

    // Assign roles if provided, otherwise assign admin role
    if (roles && Array.isArray(roles)) {
      for (const role of roles) {
        try {
          await UserModel.assignRoleToUser(userId, role);
        } catch (error) {
          console.error(`Error assigning role ${role}:`, error);
        }
      }
    } else {
      // Assign admin role by default
      await UserModel.assignRoleToUser(userId, 'admin');
    }

    res.status(201).json({ message: 'User created successfully', id: userId });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Error creating user' });
  }
};

// Update user (admin only)
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, password, email, full_name, phone, status } = req.body;

    // Check if user exists
    const existingUser = await UserModel.getUserById(Number(id));
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prepare update data
    const updateData: any = {};

    if (username !== undefined) {
      // Check if new username already exists (if different)
      if (username !== existingUser.username) {
        const userWithUsername = await UserModel.getUserByUsername(username);
        if (userWithUsername) {
          res.status(400).json({ error: 'Username already exists' });
          return;
        }
      }
      updateData.username = username;
    }

    if (email !== undefined) {
      // Check if email already exists (if different)
      if (email !== existingUser.email) {
        const userWithEmail = await UserModel.getUserByEmail(email);
        if (userWithEmail) {
          res.status(400).json({ error: 'Email is already in use' });
          return;
        }
      }
      updateData.email = email;
    }

    if (full_name !== undefined) {
      updateData.full_name = full_name;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (status !== undefined) {
      updateData.status = status;
    }
    
    // If new password provided, encrypt it
    if (password) {
      updateData.password_hash = await UserModel.hashPassword(password);
    }

    await UserModel.updateUser(Number(id), updateData);

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Error updating user' });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await UserModel.getUserById(Number(id));
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove role assignments first
    await UserModel.removeAllUserRoles(Number(id));
    
    // Delete user
    await UserModel.deleteUser(Number(id));

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Error deleting user' });
  }
};

// Verify email endpoint
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Verification token is required' });
      return;
    }

    // Verify the token and mark as verified
    const userId = await UserModel.verifyAndConsumeToken(token);
    
    if (!userId) {
      res.status(400).json({ error: 'Invalid or expired verification token' });
      return;
    }
    
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Error verifying email:', err);
    res.status(500).json({ error: 'Error verifying email' });
  }
};



// Resend verification email endpoint
export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Check if user exists
    const user = await UserModel.getUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Send verification email
    try {
      const verificationToken = emailService.instance.generateVerificationToken();
      const verificationUrl = emailService.instance.generateVerificationUrl(verificationToken);
      
      // Store new verification token
      await UserModel.storeVerificationToken(user.id!, verificationToken);
      
      const emailSent = await emailService.instance.sendEmailVerification({
        to: email,
        username: user.username!,
        verificationToken: verificationToken,
        verificationUrl: verificationUrl
      });

      if (!emailSent) {
        throw new Error('Failed to send verification email');
      }

      res.json({ message: 'Verification email sent successfully' });
    } catch (emailError) {
      const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
      console.error('❌ Error sending verification email:', errorMessage);
      res.status(500).json({ 
        error: 'Error sending verification email',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  } catch (err) {
    console.error('Error resending verification email:', err);
    res.status(500).json({ error: 'Error resending verification email' });
  }
};

// Test email service endpoint (for debugging)
export const testEmailService = async (req: Request, res: Response): Promise<void> => {
  try {
    const emailStatus = emailService.instance.getServiceStatus();
    const testResult = await emailService.instance.testConnection();
    
    res.json({
      status: emailStatus,
      connection: testResult,
      message: testResult.success 
        ? 'Email service is working correctly' 
        : 'Email service connection failed'
    });
  } catch (err) {
    console.error('Error testing email service:', err);
    res.status(500).json({ error: 'Error testing email service' });
  }
}; 