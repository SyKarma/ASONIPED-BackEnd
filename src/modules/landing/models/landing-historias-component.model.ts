import { db } from '../../../db';

export interface LandingHistoriasComponent {
  id?: number;
  titulo: string;
  descripcion: string;
  color_titulo: string;
}

export const LandingHistoriasComponentModel = {
  async getAll(): Promise<LandingHistoriasComponent[]> {
    const [rows] = await db.query('SELECT * FROM landing_historias_component ORDER BY id DESC');
    return rows as LandingHistoriasComponent[];
  },

  async getById(id: number): Promise<LandingHistoriasComponent | null> {
    const [rows] = await db.query('SELECT * FROM landing_historias_component WHERE id = ?', [id]);
    return (rows as LandingHistoriasComponent[])[0] || null;
  },

  async create(row: Omit<LandingHistoriasComponent, 'id'>): Promise<number> {
    const [result] = await db.query(
      'INSERT INTO landing_historias_component (titulo, descripcion, color_titulo) VALUES (?, ?, ?)',
      [row.titulo, row.descripcion, row.color_titulo || '#ea580c']
    );
    return (result as { insertId: number }).insertId;
  },

  async update(id: number, row: Partial<LandingHistoriasComponent>): Promise<void> {
    const fields = Object.keys(row).map((k) => `${k} = ?`).join(', ');
    const values = Object.values(row);
    await db.query(`UPDATE landing_historias_component SET ${fields} WHERE id = ?`, [...values, id]);
  },

  async delete(id: number): Promise<void> {
    await db.query('DELETE FROM landing_historias_component WHERE id = ?', [id]);
  },
};
