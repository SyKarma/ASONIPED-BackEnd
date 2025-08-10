import express from 'express';
import * as UserController from '../../controllers/user/user.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = express.Router();

// Rutas públicas (no requieren autenticación)
router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);

// Rutas protegidas (requieren autenticación)
router.get('/profile', authenticateToken, UserController.getUserProfile);
router.put('/profile', authenticateToken, UserController.updateUserProfile);
router.post('/change-password', authenticateToken, UserController.changePassword);

// Rutas de administración (requieren rol admin)
router.post('/assign-role', authenticateToken, UserController.assignRole);
router.post('/remove-role', authenticateToken, UserController.removeRole);

export default router;