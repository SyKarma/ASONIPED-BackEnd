import { Request, Response } from 'express';
import * as VolunteerOptionModel from '../../models/volunteer/volunteer_options.model';
import { volunteerCache } from '../../services/volunteer-cache.service';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../../middleware/auth.middleware';

// Get all volunteer options
export const getVolunteerOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const cacheKey = volunteerCache.getVolunteerOptionsKey();
    
    // Try cache first
    const cachedOptions = volunteerCache.get(cacheKey);
    if (cachedOptions) {
      res.json(cachedOptions);
      return;
    }

    const options = await VolunteerOptionModel.getAllVolunteerOptions();
    
    // Cache for 15 minutes (options don't change often)
    volunteerCache.set(cacheKey, options, 900);
    
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch volunteer options' });
  }
};

// Add a new volunteer option
export const addVolunteerOption = async (req: Request, res: Response): Promise<void> => {
  try {
    await VolunteerOptionModel.createVolunteerOption(req.body);
    
    // Invalidate options cache
    volunteerCache.del(volunteerCache.getVolunteerOptionsKey());
    
    res.status(201).json({ message: 'Volunteer option created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create volunteer option' });
  }
};

// Update a volunteer option
export const updateVolunteerOption = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await VolunteerOptionModel.updateVolunteerOption(id, req.body);
    
    // Invalidate options cache
    volunteerCache.del(volunteerCache.getVolunteerOptionsKey());
    
    res.json({ message: 'Volunteer option updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update volunteer option' });
  }
};


// Delete a volunteer option
export const deleteVolunteerOption = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await VolunteerOptionModel.deleteVolunteerOption(id);
    
    // Invalidate options cache
    volunteerCache.del(volunteerCache.getVolunteerOptionsKey());
    
    res.json({ message: 'Volunteer option deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete volunteer option' });
  }
};

// Accept a volunteer option proposal with optional local file upload
export const addVolunteerProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, proposal, location, date, tools } = req.body as any;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let savedPath: string | undefined;
    const uploadDir = path.join(__dirname, '../../..', 'uploads', 'volunteer-proposals');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (file && file.buffer) {
      const filename = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '_');
      const fullPath = path.join(uploadDir, filename);
      fs.writeFileSync(fullPath, file.buffer);
      savedPath = `/uploads/volunteer-proposals/${filename}`;
    }

    await VolunteerOptionModel.createVolunteerOptionProposal({
      user_id: userId,
      title,
      proposal,
      location,
      date,
      tools,
      document_path: savedPath,
    });

    res.status(201).json({ message: 'Proposal submitted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit proposal' });
  }
};

// User: list my proposals
export const getMyProposals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const proposals = await VolunteerOptionModel.getProposalsByUser(userId);
    res.json({ proposals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
};

// Admin: list all proposals
export const getAllProposals = async (req: Request, res: Response): Promise<void> => {
  try {
    const proposals = await VolunteerOptionModel.getAllProposals();
    res.json({ proposals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
};

// Admin: approve/reject a proposal
export const setProposalStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { status, note } = req.body as { status: 'approved' | 'rejected'; note?: string };
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    await VolunteerOptionModel.updateProposalStatus(id, status, note);
    res.json({ message: 'Proposal updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update proposal' });
  }
};