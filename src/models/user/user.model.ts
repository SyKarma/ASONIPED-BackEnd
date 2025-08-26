import { db } from '../../db';
import bcrypt from 'bcrypt';

export interface User {
  id?: number;
  username: string;
  email: string;
  password_hash?: string;
  full_name: string;
  phone?: string;
  status?: 'active' | 'inactive';
  created_at?: Date;
  updated_at?: Date;
}

export interface UserWithRoles extends User {
  roles?: string[];
}

export interface UserRole {
  id?: number;
  name: string;
  description?: string;
}

export interface UserRoleAssignment {
  id?: number;
  user_id: number;
  role_id: number;
  assigned_at?: Date;
}

export interface UserProfile {
  id?: number;
  user_id: number;
  profile_type: 'beneficiary' | 'volunteer' | 'donor' | 'workshop_participant';
  profile_data?: any;
  created_at?: Date;
  updated_at?: Date;
}

// Create new user
export const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const { password_hash, ...userInfo } = userData;
  
  const [result] = await db.query(
    'INSERT INTO users (username, email, password_hash, full_name, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
    [userInfo.username, userInfo.email, password_hash, userInfo.full_name, userInfo.phone, userInfo.status || 'active']
  );
  
  return (result as any).insertId;
};

// Get user by ID
export const getUserById = async (id: number): Promise<User | null> => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  const users = rows as User[];
  return users.length > 0 ? users[0] : null;
};

// Get user by username
export const getUserByUsername = async (username: string): Promise<User | null> => {
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  const users = rows as User[];
  return users.length > 0 ? users[0] : null;
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  const users = rows as User[];
  return users.length > 0 ? users[0] : null;
};

// Get user with roles
export const getUserWithRoles = async (id: number): Promise<UserWithRoles | null> => {
  const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  const users = userRows as User[];
  
  if (users.length === 0) return null;
  
  const user = users[0];
  
  // Get user roles
  const [roleRows] = await db.query(`
    SELECT ur.name 
    FROM user_roles ur 
    JOIN user_role_assignments ura ON ur.id = ura.role_id 
    WHERE ura.user_id = ?
  `, [id]);
  
  const roles = (roleRows as any[]).map(row => row.name);
  
  return {
    ...user,
    roles
  };
};

// Update user
export const updateUser = async (id: number, data: Partial<User>): Promise<void> => {
  await db.query('UPDATE users SET ? WHERE id = ?', [data, id]);
};

// Delete user
export const deleteUser = async (id: number): Promise<void> => {
  await db.query('DELETE FROM users WHERE id = ?', [id]);
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Encrypt password
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

// Assign role to user
export const assignRoleToUser = async (userId: number, roleName: string): Promise<void> => {
  // Get role ID
  const [roleRows] = await db.query('SELECT id FROM user_roles WHERE name = ?', [roleName]);
  const roles = roleRows as any[];
  
  if (roles.length === 0) {
    throw new Error(`Role '${roleName}' not found`);
  }
  
  const roleId = roles[0].id;
  
  // Check if user already has the role
  const [existingRows] = await db.query(
    'SELECT id FROM user_role_assignments WHERE user_id = ? AND role_id = ?',
    [userId, roleId]
  );
  
  if ((existingRows as any[]).length === 0) {
    // Assign the role
    await db.query(
      'INSERT INTO user_role_assignments (user_id, role_id) VALUES (?, ?)',
      [userId, roleId]
    );
  }
};

// Remove role from user
export const removeRoleFromUser = async (userId: number, roleName: string): Promise<void> => {
  // Get role ID
  const [roleRows] = await db.query('SELECT id FROM user_roles WHERE name = ?', [roleName]);
  const roles = roleRows as any[];
  
  if (roles.length === 0) {
    throw new Error(`Role '${roleName}' not found`);
  }
  
  const roleId = roles[0].id;
  
  // Remove the role
  await db.query(
    'DELETE FROM user_role_assignments WHERE user_id = ? AND role_id = ?',
    [userId, roleId]
  );
};

// Get user roles
export const getUserRoles = async (userId: number): Promise<string[]> => {
  const [rows] = await db.query(`
    SELECT ur.name 
    FROM user_roles ur 
    JOIN user_role_assignments ura ON ur.id = ura.role_id 
    WHERE ura.user_id = ?
  `, [userId]);
  
  return (rows as any[]).map(row => row.name);
};

// Check if user has role
export const userHasRole = async (userId: number, roleName: string): Promise<boolean> => {
  const [rows] = await db.query(`
    SELECT COUNT(*) as count
    FROM user_roles ur 
    JOIN user_role_assignments ura ON ur.id = ura.role_id 
    WHERE ura.user_id = ? AND ur.name = ?
  `, [userId, roleName]);
  
  return (rows as any)[0].count > 0;
};

// Create user profile
export const createUserProfile = async (profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
  await db.query(
    'INSERT INTO user_profiles (user_id, profile_type, profile_data) VALUES (?, ?, ?)',
    [profile.user_id, profile.profile_type, JSON.stringify(profile.profile_data || {})]
  );
};

// Get user profile
export const getUserProfile = async (userId: number, profileType: string): Promise<UserProfile | null> => {
  const [rows] = await db.query(
    'SELECT * FROM user_profiles WHERE user_id = ? AND profile_type = ?',
    [userId, profileType]
  );
  
  const profiles = rows as UserProfile[];
  return profiles.length > 0 ? profiles[0] : null;
};

// Update user profile
export const updateUserProfile = async (userId: number, profileType: string, data: any): Promise<void> => {
  await db.query(
    'UPDATE user_profiles SET profile_data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND profile_type = ?',
    [JSON.stringify(data), userId, profileType]
  );
}; 

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  const [rows] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
  return rows as User[];
};

// Remove all roles from a user
export const removeAllUserRoles = async (userId: number): Promise<void> => {
  await db.query('DELETE FROM user_role_assignments WHERE user_id = ?', [userId]);
}; 