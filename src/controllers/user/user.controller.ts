import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as UserModel from '../../models/user/user.model';
import { emailService } from '../../services/email.service';

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

    // Send verification email
    try {
      const verificationToken = emailService.instance.generateVerificationToken();
      const verificationUrl = emailService.instance.generateVerificationUrl(verificationToken);
      
      // Store verification token in database
      await UserModel.storeVerificationToken(userId, verificationToken);
      
      await emailService.instance.sendEmailVerification({
        to: email,
        username: username,
        verificationToken: verificationToken,
        verificationUrl: verificationUrl
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail registration if email fails, just log it
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

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await UserModel.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Error getting all users:', err);
    res.status(500).json({ error: 'Error getting users' });
  }
};

// Create new user (admin only)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.getUserByUsername(username);
    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    // Encrypt password
    const passwordHash = await UserModel.hashPassword(password);

    // Create user
    const userId = await UserModel.createUser({
      username,
      email: `${username}@asoniped.com`, // Temporary email
      password_hash: passwordHash,
      full_name: username, // Temporary name
      status: 'active'
    });

    // Assign admin role
    await UserModel.assignRoleToUser(userId, 'admin');

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
    const { username, password } = req.body;

    if (!username) {
      res.status(400).json({ error: 'Username is required' });
      return;
    }

    // Check if user exists
    const existingUser = await UserModel.getUserById(Number(id));
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if new username already exists (if different)
    if (username !== existingUser.username) {
      const userWithUsername = await UserModel.getUserByUsername(username);
      if (userWithUsername) {
        res.status(400).json({ error: 'Username already exists' });
        return;
      }
    }

    // Prepare update data
    const updateData: any = { username };
    
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
      
      await emailService.instance.sendEmailVerification({
        to: email,
        username: user.username!,
        verificationToken: verificationToken,
        verificationUrl: verificationUrl
      });

      res.json({ message: 'Verification email sent successfully' });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      res.status(500).json({ error: 'Error sending verification email' });
    }
  } catch (err) {
    console.error('Error resending verification email:', err);
    res.status(500).json({ error: 'Error resending verification email' });
  }
}; 