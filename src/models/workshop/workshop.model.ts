import { db } from '../../db';

export interface Workshop {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  objectives: string[];
  materials: string[];
  learnText: string;
}

export const WorkshopModel = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM workshops');
    // Parse objectives and materials from JSON
    return (rows as any[]).map(row => ({
      ...row,
      objectives: JSON.parse(row.objectives),
      materials: JSON.parse(row.materials),
    })) as Workshop[];
  },

  async getById(id: string) {
    const [rows] = await db.query('SELECT * FROM workshops WHERE id = ?', [id]);
    if ((rows as any[]).length === 0) return null;
    const row = (rows as any[])[0];
    return {
      ...row,
      objectives: JSON.parse(row.objectives),
      materials: JSON.parse(row.materials),
    } as Workshop;
  },

  async create(workshop: Workshop) {
    const { id, title, description, imageUrl, objectives, materials, learnText } = workshop;
    await db.query(
      'INSERT INTO workshops (id, title, description, imageUrl, objectives, materials, learnText) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, imageUrl, JSON.stringify(objectives), JSON.stringify(materials), learnText]
    );
    return workshop;
  },

  async update(id: string, workshop: Partial<Workshop>) {
    // Only update provided fields
    const fields = [];
    const values = [];
    if (workshop.title !== undefined) { fields.push('title = ?'); values.push(workshop.title); }
    if (workshop.description !== undefined) { fields.push('description = ?'); values.push(workshop.description); }
    if (workshop.imageUrl !== undefined) { fields.push('imageUrl = ?'); values.push(workshop.imageUrl); }
    if (workshop.objectives !== undefined) { fields.push('objectives = ?'); values.push(JSON.stringify(workshop.objectives)); }
    if (workshop.materials !== undefined) { fields.push('materials = ?'); values.push(JSON.stringify(workshop.materials)); }
    if (workshop.learnText !== undefined) { fields.push('learnText = ?'); values.push(workshop.learnText); }
    if (fields.length === 0) return null;
    values.push(id);
    const [result] = await db.query(
      UPDATE workshops SET ${fields.join(', ')} WHERE id = ?,
      values
    );
    if ((result as any).affectedRows === 0) return null;
    return this.getById(id);
  },

  async delete(id: string) {
    const [result] = await db.query('DELETE FROM workshops WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  },
};