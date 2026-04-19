import { db } from '../../../db';

export interface LandingHistoriasItem {
  id?: number;
  nombre: string;
  historia: string;
  video_url: string | null;
  orden: number;
}

export const LandingHistoriasItemModel = {
  async getAll(): Promise<LandingHistoriasItem[]> {
    const [rows] = await db.query(
      'SELECT * FROM landing_historias_item ORDER BY orden ASC, id ASC'
    );
    return rows as LandingHistoriasItem[];
  },

  async getById(id: number): Promise<LandingHistoriasItem | null> {
    const [rows] = await db.query('SELECT * FROM landing_historias_item WHERE id = ?', [id]);
    return (rows as LandingHistoriasItem[])[0] || null;
  },

  async create(row: Omit<LandingHistoriasItem, 'id'>): Promise<number> {
    const [result] = await db.query(
      'INSERT INTO landing_historias_item (nombre, historia, video_url, orden) VALUES (?, ?, ?, ?)',
      [row.nombre, row.historia, row.video_url || null, row.orden ?? 0]
    );
    return (result as { insertId: number }).insertId;
  },

  async update(id: number, row: Partial<LandingHistoriasItem>): Promise<void> {
    const fields = Object.keys(row).map((k) => `${k} = ?`).join(', ');
    const values = Object.values(row);
    await db.query(`UPDATE landing_historias_item SET ${fields} WHERE id = ?`, [...values, id]);
  },

  async delete(id: number): Promise<void> {
    await db.query('DELETE FROM landing_historias_item WHERE id = ?', [id]);
  },
};
