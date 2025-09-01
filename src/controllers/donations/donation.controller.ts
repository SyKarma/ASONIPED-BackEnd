// File: BackEnd/src/controllers/donation.controller.ts

import { Request, Response } from 'express';
import * as DonationModel from '../../models/donations/donation.model';

/**
 * Get all donations
 */
export const getDonations = async (req: Request, res: Response): Promise<void> => {
  try {
    const donations = await DonationModel.getAllDonations();
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
};

/**
 * Get a single donation by ID
 */
export const getDonationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }
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

/**
 * Create a new donation with automatic ticket generation
 */
export const addDonation = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get authenticated user ID
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { 
      nombre, 
      correo, 
      telefono, 
      asunto, 
      mensaje, 
      aceptacion_privacidad, 
      aceptacion_comunicacion 
    } = req.body;

    // --- STRICT VALIDATIONS ---
    
    // Full name validation (minimum first and last name)
    if (!nombre || typeof nombre !== 'string' || nombre.trim().split(' ').length < 2) {
      res.status(400).json({ error: 'Must enter a full name (minimum first and last name)' });
      return;
    }

    // Email validation
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    // Phone validation (format: 88888888)
    if (!telefono || !/^[0-9]{4}[0-9]{4}$/.test(telefono)) {
      res.status(400).json({ error: 'Invalid phone number (format: 88888888)' });
      return;
    }

    // Subject validation (minimum 10 characters)
    if (!asunto || asunto.trim().length < 10) {
      res.status(400).json({ error: 'Subject must be at least 10 characters long' });
      return;
    }

    // Message validation (minimum 10 characters)
    if (!mensaje || mensaje.trim().length < 10) {
      res.status(400).json({ error: 'Message must be at least 10 characters long' });
      return;
    }

    // Privacy and communication acceptance validation
    if (aceptacion_privacidad !== true || aceptacion_comunicacion !== true) {
      res.status(400).json({ error: 'Must accept privacy policy and communication terms' });
      return;
    }

    // Create the donation
    const donationResult = await DonationModel.createDonation({
      nombre,
      correo,
      telefono,
      asunto,
      mensaje,
      aceptacion_privacidad,
      aceptacion_comunicacion,
    });

    // Get the created donation ID
    const donationId = (donationResult as any).insertId;

    // Automatically create a ticket for this donation
    const { db } = await import('../../db');
    const [ticketResult] = await db.execute(
      'INSERT INTO donation_tickets (donation_id, user_id) VALUES (?, ?)',
      [donationId, userId]
    );
    
    const ticketId = (ticketResult as any).insertId;
    
    // Create initial automatic message
    await db.execute(
      'INSERT INTO ticket_messages (module_type, module_id, sender_id, message) VALUES (?, ?, ?, ?)',
      ['donations', ticketId, userId, `New donation request: ${asunto}\n\nMessage: ${mensaje}`]
    );

    res.status(201).json({ 
      message: 'Donation created successfully and ticket generated',
      donationId: donationId
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to create donation' });
  }
};

/**
 * Delete a donation
 */
export const deleteDonation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }
    await DonationModel.deleteDonation(id);
    res.json({ message: 'Donation deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete donation' });
  }
};
