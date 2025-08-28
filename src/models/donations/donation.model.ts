// File: BackEnd/src/models/donations/donation.model.ts
import { db } from '../../db';

/**
 * Interface representing a donation in the system
 */
export interface Donation {
  /** Unique identifier for the donation */
  id?: number;
  /** Full name of the donor */
  nombre: string;
  /** Email address of the donor */
  correo: string;
  /** Phone number of the donor */
  telefono: string;
  /** Subject/title of the donation request */
  asunto: string;
  /** Detailed message describing the donation */
  mensaje: string;
  /** Privacy policy acceptance status */
  aceptacion_privacidad: boolean;
  /** Communication terms acceptance status */
  aceptacion_comunicacion: boolean;
}

/**
 * Retrieve all donations from the database
 * @returns Promise containing an array of all donations
 */
export const getAllDonations = async (): Promise<Donation[]> => {
  const [rows] = await db.query('SELECT * FROM donations');
  return rows as Donation[];
};

/**
 * Retrieve a specific donation by its ID
 * @param id - The unique identifier of the donation
 * @returns Promise containing the donation or null if not found
 */
export const getDonationById = async (id: number): Promise<Donation | null> => {
  const [rows] = await db.query('SELECT * FROM donations WHERE id = ?', [id]);
  const donations = rows as Donation[];
  return donations.length > 0 ? donations[0] : null;
};

/**
 * Create a new donation in the database
 * @param donation - The donation object containing all required fields
 * @returns Promise containing the database operation result with insertId
 */
export const createDonation = async (donation: Donation): Promise<any> => {
  const [result] = await db.execute(
    `INSERT INTO donations 
      (nombre, correo, telefono, asunto, mensaje, aceptacion_privacidad, aceptacion_comunicacion) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      donation.nombre,
      donation.correo,
      donation.telefono,
      donation.asunto,
      donation.mensaje,
      donation.aceptacion_privacidad,
      donation.aceptacion_comunicacion,
    ]
  );
  return result;
};

/**
 * Delete a donation from the database
 * @param id - The unique identifier of the donation to delete
 * @returns Promise that resolves when the deletion is complete
 */
export const deleteDonation = async (id: number): Promise<void> => {
  await db.query('DELETE FROM donations WHERE id = ?', [id]);
};
