import express from 'express';
import { authenticateToken } from '../../../middleware/auth.middleware';
import * as ParkingController from '../controllers/parking_registration.controller';

const router = express.Router();

router.get('/public/parking/:token', ParkingController.getPublicParkingByToken);
router.post('/public/parking/:token', ParkingController.postPublicParkingByToken);

router.get(
  '/activity-tracks/:id/parking-registrations',
  authenticateToken,
  ParkingController.listParkingForActivity
);
router.post(
  '/activity-tracks/:id/parking-registrations',
  authenticateToken,
  ParkingController.createParkingForActivityAdmin
);

export default router;
