import { db } from '../../../db';

export interface Donation {
  id?: number;
  nombre?: string;
  correo?: string;
  telefono?: string;
  asunto: string;
  mensaje: string;
  aceptacion_privacidad: boolean;
  aceptacion_comunicacion: boolean;
}

export const getAllDonations = async (): Promise<Donation[]> => {
  const [rows] = await db.query('SELECT * FROM donations');
  return rows as Donation[];
};


export const getDonationById = async (id: number): Promise<Donation | null> => {
  const [rows] = await db.query('SELECT * FROM donations WHERE id = ?', [id]);
  const donations = rows as Donation[];
  return donations.length > 0 ? donations[0] : null;
};


export const createDonation = async (donation: Donation): Promise<any> => {
  const [result] = await db.execute(
    `INSERT INTO donations 
      (nombre, correo, telefono, asunto, mensaje, aceptacion_privacidad, aceptacion_comunicacion) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      donation.nombre || null,
      donation.correo || null,
      donation.telefono || null,
      donation.asunto,
      donation.mensaje,
      donation.aceptacion_privacidad,
      donation.aceptacion_comunicacion,
    ]
  );
  return result;
};

export const deleteDonation = async (id: number): Promise<void> => {
  await db.query('DELETE FROM donations WHERE id = ?', [id]);
};
