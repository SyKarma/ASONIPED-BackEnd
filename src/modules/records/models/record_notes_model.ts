import { db } from '../../../db';

export interface RecordNote {
  id?: number;
  record_id: number;
  note: string;
  admin_comment?: string;
  sections_to_modify?: string[];
  documents_to_replace?: string[];
  modification_metadata?: any;
  status: 'pending' | 'resolved' | 'cancelled';
  resolved_at?: Date;
  resolved_by?: number;
  type: 'activity' | 'modification';
  modification_type?: 'phase1_modification' | 'phase3_modification' | 'general';
  created_by?: number;
  created_at?: Date;
}

export interface Phase3ModificationRequest {
  record_id: number;
  admin_comment: string;
  sections_to_modify: string[];
  documents_to_replace: string[];
  modification_metadata?: any;
  created_by?: number;
}

export class RecordNotesModel {
  static async createNote(note: RecordNote): Promise<number> {
    const query = `
      INSERT INTO record_notes (
        record_id, note, admin_comment, sections_to_modify, 
        documents_to_replace, modification_metadata, status, 
        resolved_at, resolved_by, type, modification_type, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      note.record_id,
      note.note,
      note.admin_comment || null,
      note.sections_to_modify ? JSON.stringify(note.sections_to_modify) : null,
      note.documents_to_replace ? JSON.stringify(note.documents_to_replace) : null,
      note.modification_metadata ? JSON.stringify(note.modification_metadata) : null,
      note.status,
      note.resolved_at || null,
      note.resolved_by || null,
      note.type,
      note.modification_type || null,
      note.created_by || null
    ];

    const [result] = await db.execute(query, values);
    return (result as any).insertId;
  }

  static async createPhase3ModificationRequest(request: Phase3ModificationRequest): Promise<number> {
    const note: RecordNote = {
      record_id: request.record_id,
      note: `Modificación de Fase 3 solicitada por el administrador: ${request.admin_comment}`,
      admin_comment: request.admin_comment,
      sections_to_modify: request.sections_to_modify,
      documents_to_replace: request.documents_to_replace,
      modification_metadata: request.modification_metadata,
      status: 'pending',
      type: 'activity',
      modification_type: 'phase3_modification',
      created_by: request.created_by || undefined
    };

    return this.createNote(note);
  }

  static async getRecordNotes(recordId: number): Promise<RecordNote[]> {
    const query = `
      SELECT * FROM record_notes 
      WHERE record_id = ? 
      ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query, [recordId]);
    const notes = rows as any[];

    return notes.map(note => ({
      ...note,
      sections_to_modify: this.parseJsonField(note.sections_to_modify),
      documents_to_replace: this.parseJsonField(note.documents_to_replace),
      modification_metadata: this.parseJsonField(note.modification_metadata)
    }));
  }

  static async getPhase3ModificationRequests(recordId: number): Promise<RecordNote[]> {
    const query = `
      SELECT * FROM record_notes 
      WHERE record_id = ? AND modification_type = 'phase3_modification'
      ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query, [recordId]);
    const notes = rows as any[];

    return notes.map(note => ({
      ...note,
      sections_to_modify: this.parseJsonField(note.sections_to_modify),
      documents_to_replace: this.parseJsonField(note.documents_to_replace),
      modification_metadata: this.parseJsonField(note.modification_metadata)
    }));
  }

  static async updateNoteStatus(noteId: number, status: string, resolvedBy?: number): Promise<void> {
    const query = `
      UPDATE record_notes 
      SET status = ?, resolved_at = NOW(), resolved_by = ?
      WHERE id = ?
    `;

    await db.execute(query, [status, resolvedBy || null, noteId]);
  }

  private static parseJsonField(field: any): any {
    if (!field) return null;
    
    try {
      return JSON.parse(field);
    } catch (error) {
      console.error('Error parsing JSON field:', error);
      return null;
    }
  }
}
