import { Request, Response } from 'express';
import * as VolunteerOptionModel from '../../models/volunteer/volunteer_options.model';
import { volunteerCache } from '../../services/volunteer-cache.service';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../../middleware/auth.middleware';

// Get all volunteer options
export const getVolunteerOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    // Try to extract userId from request (optional authentication)
    let userId: number | undefined;
    
    // Check if user is authenticated
    if ((req as any).user?.userId) {
      userId = (req as any).user.userId;
    } else {
      // Try to authenticate from token in headers
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const jwt = require('jsonwebtoken');
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          userId = decoded.userId;
        } catch (tokenError) {
          // Token is invalid, continue without userId
          userId = undefined;
        }
      }
    }
    
    const cacheKey = volunteerCache.getVolunteerOptionsKey(userId);
    
    // Try cache first
    const cachedOptions = volunteerCache.get(cacheKey);
    if (cachedOptions) {
      res.json(cachedOptions);
      return;
    }

    const options = await VolunteerOptionModel.getAllVolunteerOptions(userId);
    
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
    console.log('Creating volunteer option with data:', req.body);
    const { title, description, date, location, skills, tools, hour, spots } = req.body as any;

    // Validate required fields
    if (!title || !description || !date || !location || !hour || !spots) {
      console.error('Missing required fields:', { title, description, date, location, hour, spots });
      res.status(400).json({ error: 'Missing required fields: title, description, date, location, hour, spots' });
      return;
    }

    // Save image if provided
    let imageUrl: string | undefined;
    const file = (req as any).file as Express.Multer.File | undefined;
    if (file && file.buffer) {
      const uploadDir = path.join(__dirname, '../../..', 'uploads', 'volunteer-options');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filename = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '_');
      const fullPath = path.join(uploadDir, filename);
      fs.writeFileSync(fullPath, file.buffer);
      imageUrl = `/uploads/volunteer-options/${filename}`;
    }

    const volunteerOptionData = {
      title,
      description,
      imageUrl: imageUrl || '',
      date,
      location,
      skills,
      tools,
      hour,
      spots: parseInt(spots) || 1,
    };

    console.log('Attempting to create volunteer option:', volunteerOptionData);

    await VolunteerOptionModel.createVolunteerOption(volunteerOptionData as any);
    
    // Clear all volunteer options cache (both general and user-specific)
    volunteerCache.del(volunteerCache.getVolunteerOptionsKey());
    // Clear all volunteer-related cache to ensure fresh data
    volunteerCache.invalidateVolunteers();
    
    console.log('Volunteer option created successfully, cache cleared');
    
    res.status(201).json({ message: 'Volunteer option created' });
  } catch (err) {
    console.error('Error creating volunteer option:', err);
    res.status(500).json({ error: 'Failed to create volunteer option', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

// Update a volunteer option
export const updateVolunteerOption = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, date, location, skills, tools, hour, spots } = req.body as any;

    let imageUrl: string | undefined;
    const file = (req as any).file as Express.Multer.File | undefined;
    if (file && file.buffer) {
      const uploadDir = path.join(__dirname, '../../..', 'uploads', 'volunteer-options');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filename = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '_');
      const fullPath = path.join(uploadDir, filename);
      fs.writeFileSync(fullPath, file.buffer);
      imageUrl = `/uploads/volunteer-options/${filename}`;
    }

    await VolunteerOptionModel.updateVolunteerOption(id, {
      title,
      description,
      imageUrl: imageUrl ?? (req.body.imageUrl as string),
      date,
      location,
      skills,
      tools,
      hour,
      spots: parseInt(spots) || 1,
    } as any);
    
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
    const { title, proposal, location, date, tools, hour, spots } = req.body as any;
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
      hour,
      spots: parseInt(spots) || 1,
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
    const { status, note } = req.body as { status: 'approved' | 'rejected' | 'filed'; note?: string };
    if (!['approved', 'rejected', 'filed'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    // Map 'filed' to DB-safe state: store as 'rejected' with a filed marker in note
    const mappedStatus = status === 'filed' ? 'rejected' : status;
    const mappedNote = status === 'filed'
      ? `${note ? note + ' ' : ''}[ARCHIVED]`
      : note;

    await VolunteerOptionModel.updateProposalStatus(id, mappedStatus as any, mappedNote);
    res.json({ message: 'Proposal updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update proposal' });
  }
};

// User: delete my own proposal
export const deleteMyProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const proposalId = parseInt(req.params.id);
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // First, verify that the proposal belongs to the user
    const proposals = await VolunteerOptionModel.getProposalsByUser(userId);
    const proposal = proposals.find(p => p.id === proposalId);
    
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found or not owned by user' });
      return;
    }

    // Delete the proposal
    await VolunteerOptionModel.deleteProposal(proposalId);
    
    res.json({ message: 'Proposal deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete proposal' });
  }
};