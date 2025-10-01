import { db } from '../../db';

export interface Workshop {
  id?: number;
  titulo: string;
  ubicacion: string;
  descripcion: string;
  materials: string[]; // Guardado como JSON
  aprender: string;
  fecha: string;      // 'YYYY-MM-DD'
  hora: string;       // 'HH:mm'
  capacidad: number;
  imagen: string;
}

export const WorkshopModel = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM workshops');
    return (rows as any[]).map(row => ({
      ...row,
      materials: JSON.parse(row.materials),
    })) as Workshop[];
  },

  async getById(id: number) {
    const [rows] = await db.query('SELECT * FROM workshops WHERE id = ?', [id]);
    if ((rows as any[]).length === 0) return null;
    const row = (rows as any[])[0];
    return {
      ...row,
      materials: JSON.parse(row.materials),
    } as Workshop;
  },

  async create(workshop: Workshop) {
    const { titulo, ubicacion, descripcion, materials, aprender, fecha, hora, capacidad, imagen } = workshop;
    const [result] = await db.query(
      'INSERT INTO workshops (titulo, ubicacion, descripcion, materials, aprender, fecha, hora, capacidad, imagen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [titulo, ubicacion, descripcion, JSON.stringify(materials), aprender, fecha, hora, capacidad, imagen]
    );
    return { id: (result as any).insertId, ...workshop };
  },

  async update(id: number, workshop: Partial<Workshop>) {
    const fields = [];
    const values = [];
    if (workshop.titulo !== undefined) { fields.push('titulo = ?'); values.push(workshop.titulo); }
    if (workshop.ubicacion !== undefined) { fields.push('ubicacion = ?'); values.push(workshop.ubicacion); }
    if (workshop.descripcion !== undefined) { fields.push('descripcion = ?'); values.push(workshop.descripcion); }
    if (workshop.materials !== undefined) { fields.push('materials = ?'); values.push(JSON.stringify(workshop.materials)); }
    if (workshop.aprender !== undefined) { fields.push('aprender = ?'); values.push(workshop.aprender); }
    if (workshop.fecha !== undefined) { fields.push('fecha = ?'); values.push(workshop.fecha); }
    if (workshop.hora !== undefined) { fields.push('hora = ?'); values.push(workshop.hora); }
    if (workshop.capacidad !== undefined) { fields.push('capacidad = ?'); values.push(workshop.capacidad); }
    if (workshop.imagen !== undefined) { fields.push('imagen = ?'); values.push(workshop.imagen); }
    if (fields.length === 0) return null;
    values.push(id);
    const [result] = await db.query(
      `UPDATE workshops SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    if ((result as any).affectedRows === 0) return null;
    return this.getById(id);
  },

  async delete(id: number) {
    const [result] = await db.query('DELETE FROM workshops WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  },
};