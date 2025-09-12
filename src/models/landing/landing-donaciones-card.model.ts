import { db } from '../../db';

// landin donaciones cards

export interface LandingDonacionesCard {
  id?: number;
  titulo_card: string;
  descripcion_card: string;
  URL_imagen?: string;
  texto_boton: string;
  color_boton?: string;
}

export const LandingDonacionesCardModel = {
  async getAll(): Promise<LandingDonacionesCard[]> {
    const [rows] = await db.query('SELECT * FROM landing_donaciones_card ORDER BY id DESC');
    return rows as LandingDonacionesCard[];
  },

  async getById(id: number): Promise<LandingDonacionesCard | null> {
    const [rows] = await db.query('SELECT * FROM landing_donaciones_card WHERE id = ?', [id]);
    return (rows as LandingDonacionesCard[])[0] || null;
  },

  async create(card: LandingDonacionesCard): Promise<number> {
    const [result] = await db.query(
      'INSERT INTO landing_donaciones_card (titulo_card, descripcion_card, URL_imagen, texto_boton, color_boton) VALUES (?, ?, ?, ?, ?)',
      [
        card.titulo_card,
        card.descripcion_card,
        card.URL_imagen,
        card.texto_boton,
        card.color_boton || 'ORANGE',
      ]
    );
    return (result as any).insertId;
  },

  async update(id: number, card: Partial<LandingDonacionesCard>): Promise<void> {
    const fields = Object.keys(card).map(key => `${key} = ?`).join(', ');
    const values = Object.values(card);
    await db.query(`UPDATE landing_donaciones_card SET ${fields} WHERE id = ?`, [...values, id]);
  },

  async delete(id: number): Promise<void> {
    await db.query('DELETE FROM landing_donaciones_card WHERE id = ?', [id]);
  }
};