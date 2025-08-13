import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as UserModel from '../../models/user/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Registrar nuevo usuario
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, full_name, phone, roles } = req.body;

    // Validaciones básicas
    if (!username || !email || !password || !full_name) {
      res.status(400).json({ error: 'Todos los campos obligatorios son requeridos' });
      return;
    }

    // Verificar si el usuario ya existe
    const existingUser = await UserModel.getUserByUsername(username);
    if (existingUser) {
      res.status(400).json({ error: 'El nombre de usuario ya existe' });
      return;
    }

    const existingEmail = await UserModel.getUserByEmail(email);
    if (existingEmail) {
      res.status(400).json({ error: 'El email ya está registrado' });
      return;
    }

    // Encriptar contraseña
    const passwordHash = await UserModel.hashPassword(password);

    // Crear usuario
    const userId = await UserModel.createUser({
      username,
      email,
      password_hash: passwordHash,
      full_name,
      phone,
      status: 'active'
    });

    // Asignar roles si se proporcionan
    if (roles && Array.isArray(roles)) {
      for (const role of roles) {
        try {
          await UserModel.assignRoleToUser(userId, role);
        } catch (error) {
          console.error(`Error assigning role ${role}:`, error);
        }
      }
    } else {
      // Asignar rol básico por defecto
      await UserModel.assignRoleToUser(userId, 'user');
    }

    // Obtener usuario con roles
    const userWithRoles = await UserModel.getUserWithRoles(userId);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
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
    res.status(500).json({ error: 'Error registrando usuario' });
  }
};

// Login de usuario
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
      return;
    }

    // Buscar usuario por username o email
    let user = await UserModel.getUserByUsername(username);
    if (!user) {
      user = await UserModel.getUserByEmail(username);
    }

    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // Verificar contraseña
    const isValidPassword = await UserModel.verifyPassword(password, user.password_hash!);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // Verificar que el usuario esté activo
    if (user.status !== 'active') {
      res.status(401).json({ error: 'Cuenta inactiva' });
      return;
    }

    // Obtener roles del usuario
    const roles = await UserModel.getUserRoles(user.id!);

    // Generar token JWT
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
      message: 'Login exitoso',
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
    res.status(500).json({ error: 'Error durante el login' });
  }
};

// Obtener perfil del usuario actual
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const user = await UserModel.getUserWithRoles(userId);
    
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
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
    res.status(500).json({ error: 'Error obteniendo perfil de usuario' });
  }
};

// Actualizar perfil de usuario
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { full_name, phone, email } = req.body;

    // Verificar si el email ya existe (si se está cambiando)
    if (email) {
      const existingUser = await UserModel.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        res.status(400).json({ error: 'El email ya está en uso' });
        return;
      }
    }

    // Actualizar datos del usuario
    const updateData: any = {};
    if (full_name) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (email) updateData.email = email;

    await UserModel.updateUser(userId, updateData);

    res.json({ message: 'Perfil actualizado exitosamente' });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Error actualizando perfil' });
  }
};

// Cambiar contraseña
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Contraseña actual y nueva contraseña son requeridas' });
      return;
    }

    // Obtener usuario actual
    const user = await UserModel.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Verificar contraseña actual
    const isValidPassword = await UserModel.verifyPassword(currentPassword, user.password_hash!);
    if (!isValidPassword) {
      res.status(400).json({ error: 'Contraseña actual incorrecta' });
      return;
    }

    // Encriptar nueva contraseña
    const newPasswordHash = await UserModel.hashPassword(newPassword);

    // Actualizar contraseña
    await UserModel.updateUser(userId, { password_hash: newPasswordHash });

    res.json({ message: 'Contraseña cambiada exitosamente' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Error cambiando contraseña' });
  }
};

// Asignar rol a usuario (solo admins)
export const assignRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      res.status(400).json({ error: 'ID de usuario y nombre de rol son requeridos' });
      return;
    }

    await UserModel.assignRoleToUser(userId, roleName);

    res.json({ message: 'Rol asignado exitosamente' });
  } catch (err) {
    console.error('Error assigning role:', err);
    res.status(500).json({ error: 'Error asignando rol' });
  }
};

// Remover rol de usuario (solo admins)
export const removeRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      res.status(400).json({ error: 'ID de usuario y nombre de rol son requeridos' });
      return;
    }

    await UserModel.removeRoleFromUser(userId, roleName);

    res.json({ message: 'Rol removido exitosamente' });
  } catch (err) {
    console.error('Error removing role:', err);
    res.status(500).json({ error: 'Error removiendo rol' });
  }
}; 

// Obtener todos los usuarios (solo para admins)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await UserModel.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Error getting all users:', err);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
};

// Crear nuevo usuario (solo para admins)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
      return;
    }

    // Verificar si el usuario ya existe
    const existingUser = await UserModel.getUserByUsername(username);
    if (existingUser) {
      res.status(400).json({ error: 'El nombre de usuario ya existe' });
      return;
    }

    // Encriptar contraseña
    const passwordHash = await UserModel.hashPassword(password);

    // Crear usuario
    const userId = await UserModel.createUser({
      username,
      email: `${username}@asoniped.com`, // Email temporal
      password_hash: passwordHash,
      full_name: username, // Nombre temporal
      status: 'active'
    });

    // Asignar rol admin
    await UserModel.assignRoleToUser(userId, 'admin');

    res.status(201).json({ message: 'Usuario creado exitosamente', id: userId });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Error creando usuario' });
  }
};

// Actualizar usuario (solo para admins)
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    if (!username) {
      res.status(400).json({ error: 'Usuario es requerido' });
      return;
    }

    // Verificar si el usuario existe
    const existingUser = await UserModel.getUserById(Number(id));
    if (!existingUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Verificar si el nuevo username ya existe (si es diferente)
    if (username !== existingUser.username) {
      const userWithUsername = await UserModel.getUserByUsername(username);
      if (userWithUsername) {
        res.status(400).json({ error: 'El nombre de usuario ya existe' });
        return;
      }
    }

    // Preparar datos de actualización
    const updateData: any = { username };
    
    // Si se proporciona nueva contraseña, encriptarla
    if (password) {
      updateData.password_hash = await UserModel.hashPassword(password);
    }

    await UserModel.updateUser(Number(id), updateData);

    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Error actualizando usuario' });
  }
};

// Eliminar usuario (solo para admins)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar si el usuario existe
    const existingUser = await UserModel.getUserById(Number(id));
    if (!existingUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Eliminar asignaciones de roles primero
    await UserModel.removeAllUserRoles(Number(id));
    
    // Eliminar usuario
    await UserModel.deleteUser(Number(id));

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Error eliminando usuario' });
  }
}; 