import express from 'express';
import * as UserController from '../controllers/user.controller';
import * as PasswordResetController from '../controllers/password_reset.controller';
import { authenticateToken } from '../../../middleware/auth.middleware';
import { forgotPasswordRateLimit } from '../../../middleware/rate_limit.middleware';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);
router.post('/verify-email', UserController.verifyEmail);
router.post('/resend-verification', UserController.resendVerificationEmail);

// Password recovery routes (no authentication required)
router.post('/forgot-password', forgotPasswordRateLimit, PasswordResetController.forgotPassword);
router.post('/reset-password', PasswordResetController.resetPassword);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, UserController.getUserProfile);
router.put('/profile', authenticateToken, UserController.updateUserProfile);
router.post('/change-password', authenticateToken, UserController.changePassword);

// Administration routes (require admin role)
router.get('/', authenticateToken, UserController.getAllUsers);
router.get('/eligible-for-handover', authenticateToken, UserController.getEligibleUsersForHandover);
router.post('/', authenticateToken, UserController.createUser);
router.put('/:id', authenticateToken, UserController.updateUser);
router.delete('/:id', authenticateToken, UserController.deleteUser);
router.post('/assign-role', authenticateToken, UserController.assignRole);
router.post('/remove-role', authenticateToken, UserController.removeRole);

export default router;