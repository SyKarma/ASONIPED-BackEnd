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

// Create a new donation (with strict validation)
export const addDonation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, correo, telefono, asunto, mensaje, aceptacion_privacidad, aceptacion_comunicacion } = req.body;

    // --- VALIDACIONES ESTRICTAS ---
    if (!nombre || typeof nombre !== 'string' || nombre.trim().split(' ').length < 2) {
      res.status(400).json({ error: 'Debe ingresar un nombre completo (mínimo nombre y apellido)' });
      return;
    }
// condicion del correo
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      res.status(400).json({ error: 'Correo electrónico inválido' });
      return;
    }
// condicion del telefono
    if (!telefono || !/^[0-9]{4}[0-9]{4}$/.test(telefono)) {
      res.status(400).json({ error: 'Teléfono inválido (formato 88888888)' });
      return;
    }
// condicion del asunto
    if (!asunto || asunto.trim().length < 10) {
      res.status(400).json({ error: 'El asunto debe tener al menos 10 caracteres' });
      return;
    }
//condicion del mensaje
    if (!mensaje || mensaje.trim().length < 10) {
      res.status(400).json({ error: 'El mensaje debe tener al menos 10 caracteres' });
      return;
    }
// condiciones de las aceptaciones
    if (aceptacion_privacidad !== true || aceptacion_comunicacion !== true) {
      res.status(400).json({ error: 'Debe aceptar la política de privacidad y la comunicación' });
      return;
    }
    // -----------------------------

    await DonationModel.createDonation({
      nombre,
      correo,
      telefono,
      asunto,
      mensaje,
      aceptacion_privacidad,
      aceptacion_comunicacion,
    });

    res.status(201).json({ message: 'Donation created successfully' });

  } catch (err) {
    res.status(500).json({ error: 'Failed to create donation' });
  }
};

// Delete a donation
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
