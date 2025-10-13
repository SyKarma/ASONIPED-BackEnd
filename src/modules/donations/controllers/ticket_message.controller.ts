import { Request, Response } from 'express';
import { db } from '../../../db';
import { TicketMessage, CreateTicketMessage } from '../models/ticket_message.model';

export class TicketMessageController {

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { module_type, module_id, sender_id, message }: CreateTicketMessage = req.body;
      
      const [result] = await db.execute(
        'INSERT INTO ticket_messages (module_type, module_id, sender_id, message) VALUES (?, ?, ?, ?)',
        [module_type, module_id, sender_id, message]
      );
      
      res.status(201).json({ 
        message: 'Message sent successfully',
        messageId: (result as any).insertId 
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }


  static async getByTicketId(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { module_type } = req.query;
      
      const [messages] = await db.execute(`
        SELECT 
          tm.*, 
          u.full_name as sender_name
        FROM ticket_messages tm
        LEFT JOIN users u ON tm.sender_id = u.id
        WHERE tm.module_type = ? AND tm.module_id = ?
        ORDER BY tm.timestamp ASC
      `, [module_type, ticketId]);
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }


  static async getByDonationTicketId(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      
      const [messages] = await db.execute(`
        SELECT 
          tm.*, 
          u.full_name as sender_name
        FROM ticket_messages tm
        LEFT JOIN users u ON tm.sender_id = u.id
        WHERE tm.module_type = 'donations' AND tm.module_id = ?
        ORDER BY tm.timestamp ASC
      `, [ticketId]);
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }


  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const [messages] = await db.execute(`
        SELECT 
          tm.*, 
          u.full_name as sender_name
        FROM ticket_messages tm
        LEFT JOIN users u ON tm.sender_id = u.id
        ORDER BY tm.timestamp DESC
      `);
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }


  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await db.execute(
        'DELETE FROM ticket_messages WHERE id = ?',
        [id]
      );
      
      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
