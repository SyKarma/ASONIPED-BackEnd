import { Request, Response } from 'express';
import * as DonationModel from '../models/donation.model';


export const getDonations = async (req: Request, res: Response): Promise<void> => {
  try {
    const donations = await DonationModel.getAllDonations();
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
};


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


export const addDonation = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get authenticated user ID (optional for anonymous donations)
    const userId = (req as any).user?.userId || null;
    
    const { 
      nombre, 
      correo, 
      telefono, 
      asunto, 
      mensaje, 
      aceptacion_privacidad, 
      aceptacion_comunicacion,
      isAnonymous = false
    } = req.body;

    // --- CONDITIONAL VALIDATIONS ---
    
    // Only validate personal fields if not anonymous
    if (!isAnonymous) {
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
        res.status(400).json({ error: 'Invalid phone number (format: 8888-8888)' });
        return;
      }
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

    // Determine if this should be an anonymous ticket
    // Anonymous if: explicitly marked as anonymous OR no user ID (no authentication)
    const shouldBeAnonymous = isAnonymous || !userId;

    // Generate session ID for anonymous users
    const sessionId = shouldBeAnonymous ? `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}` : null;
    
    if (!shouldBeAnonymous && userId) {
      // Authenticated user - create regular ticket
      const { db } = await import('../../../db');
      const [ticketResult] = await db.execute(
        'INSERT INTO donation_tickets (donation_id, user_id) VALUES (?, ?)',
        [donationId, userId]
      );
      
      const ticketId = (ticketResult as any).insertId;
      
      // Create initial automatic message
      await db.execute(
        'INSERT INTO ticket_messages (module_type, module_id, sender_id, message) VALUES (?, ?, ?, ?)',
        ['donations', ticketId, userId, `Nueva solicitud de ayuda: ${asunto}\n\nMensaje: ${mensaje}`]
      );

      res.status(201).json({ 
        message: 'Solicitud de ayuda creada exitosamente y ticket generado',
        donationId: donationId,
        ticketType: 'authenticated'
      });
    } else {
      // Anonymous user (either explicitly marked or no authentication) - create anonymous ticket
      const { db } = await import('../../../db');
      
      // Generate unique ticket ID for public lookup
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 6);
      const ticketId = `T${timestamp}${random}`.toUpperCase();
      
      const [ticketResult] = await db.execute(
        'INSERT INTO anonymous_tickets (ticket_id, donation_id, session_id) VALUES (?, ?, ?)',
        [ticketId, donationId, sessionId]
      );
      
      const anonymousTicketId = (ticketResult as any).insertId;
      
      // Create initial automatic message
      await db.execute(
        'INSERT INTO anonymous_ticket_messages (ticket_id, sender_type, message) VALUES (?, ?, ?)',
        [anonymousTicketId, 'user', `Nueva solicitud de ayuda: ${asunto}\n\nMensaje: ${mensaje}`]
      );

      res.status(201).json({ 
        message: 'Anonymous donation created successfully and ticket generated',
        donationId: donationId,
        ticketId: ticketId,
        ticketType: 'anonymous',
        sessionId: sessionId
      });
    }

  } catch (err) {
    console.error('Error creating donation:', err);
    res.status(500).json({ error: 'Failed to create donation' });
  }
};


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
