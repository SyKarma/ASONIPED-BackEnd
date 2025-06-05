import { Router, Request, Response } from 'express';
import { getAllWorkshops, getWorkshopById, createWorkshop, updateWorkshop, deleteWorkshop } from '../../controllers/workshop/workshop.controller';

const router = Router();

// Get all workshops
router.get('/', async (req: Request, res: Response) => {
    await getAllWorkshops(req, res);
});

// Get a single workshop by ID
router.get('/:id', async (req: Request, res: Response) => {
    await getWorkshopById(req, res);
});

// Create a new workshop
router.post('/', async (req: Request, res: Response) => {
    await createWorkshop(req, res);
});

// Update a workshop
router.put('/:id', async (req: Request, res: Response) => {
    await updateWorkshop(req, res);
});

// Delete a workshop
router.delete('/:id', async (req: Request, res: Response) => {
    await deleteWorkshop(req, res);
});

export default router;