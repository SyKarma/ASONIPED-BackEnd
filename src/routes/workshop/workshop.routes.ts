import { Router, Request, Response } from 'express';
import { getAllWorkshops, getWorkshopById, createWorkshop, updateWorkshop, deleteWorkshop } from '../../controllers/workshop/workshop.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Get all workshops (public)
router.get('/', async (req: Request, res: Response) => {
    await getAllWorkshops(req, res);
});

// Get a single workshop by ID (public)
router.get('/:id', async (req: Request, res: Response) => {
    await getWorkshopById(req, res);
});

// Create a new workshop (protected)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    await createWorkshop(req, res);
});

// Update a workshop (protected)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
    await updateWorkshop(req, res);
});

// Delete a workshop (protected)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    await deleteWorkshop(req, res);
});

export default router;