import { db } from '../../db';

export interface Donation {
  id?: number;
  nombre: string;
  telefono: string;
  correo: string;
  tipo: string;
  metodo: string;
  monto: string;
  aceptar: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  created_at?: Date;
}

// Get all donations
export const getAllDonations = async (): Promise<Donation[]> => {
  const [rows] = await db.query('SELECT * FROM donations');
  return rows as Donation[];
};

// Get a donation by ID
export const getDonationById = async (id: number): Promise<Donation | null> => {
  const [rows] = await db.query('SELECT * FROM donations WHERE id = ?', [id]);
  const donations = rows as Donation[];
  return donations.length > 0 ? donations[0] : null;
};

// Create a new donation
export const createDonation = async (donation: Donation): Promise<void> => {
  await db.query(
    `INSERT INTO donations (nombre, telefono, correo, tipo, metodo, monto, aceptar, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      donation.nombre,
      donation.telefono,
      donation.correo,
      donation.tipo,
      donation.metodo,
      donation.monto,
      donation.aceptar,
      donation.status || 'pending',
    ]
  );
};

// Update donation status
export const updateDonationStatus = async (id: number, status: 'pending' | 'approved' | 'rejected'): Promise<void> => {
  await db.query('UPDATE donations SET status = ? WHERE id = ?', [status, id]);
};

// Delete a donation
export const deleteDonation = async (id: number): Promise<void> => {
  await db.query('DELETE FROM donations WHERE id = ?', [id]);
};