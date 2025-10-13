import { db } from '../../../db';

// about us model
export interface AboutSection {
  id?: number;
  titulo: string;
  URL_imagen?: string;
  descripcion: string;
  texto_boton: string;
  color_boton?: string;
}

export const AboutSectionModel = {
  async getAll(): Promise<AboutSection[]> {
    const [rows] = await db.query('SELECT * FROM AboutSection ORDER BY id DESC');
    return rows as AboutSection[];
  },

  async getById(id: number): Promise<AboutSection | null> {
    const [rows] = await db.query('SELECT * FROM AboutSection WHERE id = ?', [id]);
    return (rows as AboutSection[])[0] || null;
  },

  async create(section: AboutSection): Promise<number> {
    const [result] = await db.query(
      'INSERT INTO AboutSection (titulo, URL_imagen, descripcion, texto_boton, color_boton) VALUES (?, ?, ?, ?, ?)',
      [
        section.titulo,
        section.URL_imagen,
        section.descripcion,
        section.texto_boton,
        section.color_boton,
      ]
    );
    return (result as any).insertId;
  },

  async update(id: number, section: Partial<AboutSection>): Promise<void> {
    const fields = Object.keys(section).map(key => `${key} = ?`).join(', ');
    const values = Object.values(section);
    await db.query(`UPDATE AboutSection SET ${fields} WHERE id = ?`, [...values, id]);
  },

  async delete(id: number): Promise<void> {
    await db.query('DELETE FROM AboutSection WHERE id = ?', [id]);
  }
};