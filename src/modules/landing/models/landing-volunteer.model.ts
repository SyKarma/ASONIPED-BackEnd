import { db } from '../../../db';

export interface LandingVolunteer {
  id?: number;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  URL_imagen: string;
  texto_boton: string;
  color_boton: string;
}

export const LandingVolunteerModel = {
  async getAll(): Promise<LandingVolunteer[]> {
    const [rows] = await db.query('SELECT * FROM landing_Volunteer ORDER BY id DESC');
    return rows as LandingVolunteer[];
  },

  async getById(id: number): Promise<LandingVolunteer | null> {
    const [rows] = await db.query('SELECT * FROM landing_Volunteer WHERE id = ?', [id]);
    return (rows as LandingVolunteer[])[0] || null;
  },

  async create(volunteer: LandingVolunteer): Promise<number> {
    const [result] = await db.query(
      'INSERT INTO landing_Volunteer (titulo, subtitulo, descripcion, URL_imagen, texto_boton, color_boton) VALUES (?, ?, ?, ?, ?, ?)',
      [
        volunteer.titulo,
        volunteer.subtitulo,
        volunteer.descripcion,
        volunteer.URL_imagen,
        volunteer.texto_boton,
        volunteer.color_boton,
      ]
    );
    return (result as any).insertId;
  },

  async update(id: number, volunteer: Partial<LandingVolunteer>): Promise<void> {
    const fields = Object.keys(volunteer).map(key => `${key} = ?`).join(', ');
    const values = Object.values(volunteer);
    await db.query(`UPDATE landing_Volunteer SET ${fields} WHERE id = ?`, [...values, id]);
  },

  async delete(id: number): Promise<void> {
    await db.query('DELETE FROM landing_Volunteer WHERE id = ?', [id]);
  }
};