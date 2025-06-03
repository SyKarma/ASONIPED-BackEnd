// File: BackEnd/src/controllers/donation.controller.ts

import { Request, Response } from 'express';
import * as DonationModel from '../../models/donations/donation.model';

// Get all donations
export const getDonations = async (req: Request, res: Response): Promise<void> => {
  try {
    const donations = await DonationModel.getAllDonations();
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
};

// Get a single donation by ID
export const getDonationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const donation = await DonationModel.getDonationById(id);
    if (!donation) {
      res.status(404).json({ error: 'Donation not found' });
      return;
    }
    res.json(donation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch donation' });
  }
};

// Create a new donation
export const addDonation = async (req: Request, res: Response): Promise<void> => {
  try {
    await DonationModel.createDonation(req.body);
    res.status(201).json({ message: 'Donation created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create donation' });
  }
};

// Update donation status
export const updateDonationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status value' });
      return;
    }
    await DonationModel.updateDonationStatus(id, status);
    res.json({ message: 'Donation status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update donation status' });
  }
};

// Delete a donation
export const deleteDonation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await DonationModel.deleteDonation(id);
    res.json({ message: 'Donation deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete donation' });
  }
};