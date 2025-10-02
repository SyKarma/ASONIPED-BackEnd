import express from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { uploadRecordDocuments, validateUpload, handleUploadError } from '../../middleware/upload.middleware';
import * as RecordController from '../../controllers/records/record.controller';

const router = express.Router();

// Public routes (for registration form)
router.post('/', authenticateToken, RecordController.createRecord); // Create record (requires authentication)

// Admin routes
router.post('/admin-direct', authenticateToken, uploadRecordDocuments, handleUploadError, RecordController.createAdminDirectRecord); // Admin direct record creation
router.put('/:id/admin-edit', authenticateToken, uploadRecordDocuments, handleUploadError, RecordController.updateRecordAdmin); // Admin record edit with override
router.put('/:id/handover', authenticateToken, RecordController.handoverRecordToUser); // Hand over admin-created record to user

// Test and debug routes (without authentication)
router.get('/test', (req: any, res: any) => res.json({ message: 'Records routes are working!' })); // Test route
router.get('/check-personal-data', RecordController.checkPersonalDataTable); // Check personal_data table
router.get('/debug/database-public', RecordController.debugDatabase); // Temporary debug without authentication

// Protected specific routes (must go BEFORE routes with parameters)
router.get('/my-record', authenticateToken, RecordController.getMyRecord); // Get user's record
router.get('/stats', authenticateToken, RecordController.getRecordStats); // Statistics
router.get('/geographic-analytics', authenticateToken, RecordController.getGeographicAnalytics); // Geographic analytics only
router.get('/disability-analytics', authenticateToken, RecordController.getDisabilityAnalytics); // Disability analytics only
router.get('/family-analytics', authenticateToken, RecordController.getFamilyAnalytics); // Family analytics only
router.get('/debug/database', authenticateToken, RecordController.debugDatabase); // Temporary debug
router.post('/:id/id-qr', authenticateToken, RecordController.createIdQr); // Create signed QR for ID (owner/admin)
router.post('/attendance/scan', authenticateToken, RecordController.scanAttendance); // Verify QR and register attendance (stub)

// Routes with specific parameters
router.get('/search/cedula/:cedula', authenticateToken, RecordController.searchRecordByCedula); // Search by cedula
router.get('/check-cedula/:cedula', authenticateToken, RecordController.checkCedulaExists); // Check cedula
router.get('/check-cedula-availability/:cedula', RecordController.checkCedulaAvailability); // Check cedula availability

// General routes (require authentication)
router.get('/', authenticateToken, RecordController.getRecords); // List records

// Routes for specific records (with parameters)
router.get('/:id', authenticateToken, RecordController.getRecordById); // Get record
router.put('/:id', authenticateToken, RecordController.updateRecord); // Update record
router.put('/:id/complete', authenticateToken, uploadRecordDocuments, handleUploadError, RecordController.completeRecord); // Complete record
router.delete('/:id', authenticateToken, RecordController.deleteRecord); // Delete record
router.patch('/:id/status', authenticateToken, RecordController.updateRecordStatus); // Change status

// Routes for approvals/rejections
router.put('/:id/approve-phase1', authenticateToken, RecordController.approvePhase1); // Approve phase 1
router.put('/:id/reject-phase1', authenticateToken, RecordController.rejectPhase1); // Reject phase 1
router.put('/:id/request-modification', authenticateToken, RecordController.requestPhase1Modification); // Request modification
router.put('/:id/request-phase3-modification', authenticateToken, RecordController.requestPhase3Modification); // Request Phase 3 modification
router.put('/:id/update-phase1', authenticateToken, RecordController.updatePhase1Data); // Update phase 1 data
router.put('/:id/update-phase3', authenticateToken, uploadRecordDocuments, handleUploadError, RecordController.updatePhase3Data); // Update phase 3 data
router.put('/:id/approve', authenticateToken, RecordController.approveRecord); // Approve complete record
router.put('/:id/reject', authenticateToken, RecordController.rejectRecord); // Reject complete record

// Routes for managing comments
router.put('/notes/:noteId', authenticateToken, RecordController.updateNote); // Update comment
router.delete('/notes/:noteId', authenticateToken, RecordController.deleteNote); // Delete comment

// Route to delete record
router.delete('/:id', authenticateToken, RecordController.deleteRecord); // Delete record

export default router; 