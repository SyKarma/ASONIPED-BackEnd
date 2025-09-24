import { db } from '../../db';

export interface HeroSection {
  id?: number;
  titulo: string;
  url_imagen?: string;
  descripcion: string;
  texto_boton_izquierdo: string;
  color_boton_izquierdo?: string;
  texto_boton_derecho: string;
  color_boton_derecho?: string;
}
// Modelo para interactuar con la tabla hero_section
export const HeroSectionModel = {
  async getAll(): Promise<HeroSection[]> {
    const [rows] = await db.query('SELECT * FROM hero_section ORDER BY id DESC');
    return rows as HeroSection[];
  },
// Obtiene una sección hero por ID
  async getById(id: number): Promise<HeroSection | null> {
    const [rows] = await db.query('SELECT * FROM hero_section WHERE id = ?', [id]);
    return (rows as HeroSection[])[0] || null;
  },
// Crea una nueva sección hero
  async create(section: HeroSection): Promise<number> {
    const [result] = await db.query(
      'INSERT INTO hero_section (titulo, url_imagen, descripcion, texto_boton_izquierdo, color_boton_izquierdo, texto_boton_derecho, color_boton_derecho) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        section.titulo,
        section.url_imagen,
        section.descripcion,
        section.texto_boton_izquierdo,
        section.color_boton_izquierdo || 'orange',
        section.texto_boton_derecho,
        section.color_boton_derecho || 'blue'
      ]
    );
    return (result as any).insertId;
  },
// Actualiza una sección hero existente
  async update(id: number, section: Partial<HeroSection>): Promise<void> {
    const fields = Object.keys(section).map(key => `${key} = ?`).join(', ');
    const values = Object.values(section);
    await db.query(`UPDATE hero_section SET ${fields} WHERE id = ?`, [...values, id]);
  },
// Elimina una sección hero por ID
  async delete(id: number): Promise<void> {
    await db.query('DELETE FROM hero_section WHERE id = ?', [id]);
  }
};