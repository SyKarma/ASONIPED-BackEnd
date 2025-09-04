import { Request, Response } from 'express';
import { db } from '../../db';
import { AnonymousTicket, CreateAnonymousTicket, UpdateAnonymousTicket, AnonymousTicketMessage, CreateAnonymousTicketMessage } from '../../models/donations/anonymous_ticket.model';
import { v4 as uuidv4 } from 'uuid';

export class AnonymousTicketController {
  /**
   * Generate a unique ticket ID for public lookup
   */
  private static generateTicketId(): string {
    // Generate a short, readable ticket ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `T${timestamp}${random}`.toUpperCase();
  }

  /**
   * Create a new anonymous ticket
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { donation_id, session_id }: CreateAnonymousTicket = req.body;
      
      // Generate unique ticket ID
      const ticket_id = this.generateTicketId();
      
      const [result] = await db.execute(
        'INSERT INTO anonymous_tickets (ticket_id, donation_id, session_id) VALUES (?, ?, ?)',
        [ticket_id, donation_id, session_id]
      );
      
      // Create initial message from the donation
      const ticketId = (result as any).insertId;
      const [donationResult] = await db.execute(
        'SELECT mensaje FROM donations WHERE id = ?',
        [donation_id]
      );
      
      if ((donationResult as any[]).length > 0) {
        const initialMessage = (donationResult as any[])[0].mensaje || 'Ticket created for donation';
        await db.execute(
          'INSERT INTO anonymous_ticket_messages (ticket_id, sender_type, message) VALUES (?, ?, ?)',
          [ticketId, 'user', initialMessage]
        );
      }
      
      res.status(201).json({ 
        message: 'Anonymous ticket created successfully',
        ticket_id: ticket_id,
        ticketId: ticketId
      });
    } catch (error) {
      console.error('Error creating anonymous ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get all anonymous tickets (for admin dashboard)
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const [tickets] = await db.execute(`
        SELECT 
          at.*, 
          d.nombre, 
          d.correo, 
          d.asunto, 
          d.mensaje,
          u.full_name as admin_name
        FROM anonymous_tickets at
        LEFT JOIN donations d ON at.donation_id = d.id
        LEFT JOIN users u ON at.assigned_admin_id = u.id
        ORDER BY at.created_at DESC
      `);
      
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching anonymous tickets:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get anonymous ticket by public ticket ID
   */
  static async getByTicketId(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      
      const [tickets] = await db.execute(`
        SELECT 
          at.*, 
          d.nombre, 
          d.correo, 
          d.asunto, 
          d.mensaje,
          u.full_name as admin_name
        FROM anonymous_tickets at
        LEFT JOIN donations d ON at.donation_id = d.id
        LEFT JOIN users u ON at.assigned_admin_id = u.id
        WHERE at.ticket_id = ?
      `, [ticketId]);
      
      if ((tickets as any[]).length === 0) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      
      res.json((tickets as any[])[0]);
    } catch (error) {
      console.error('Error fetching anonymous ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get a specific anonymous ticket by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const [tickets] = await db.execute(`
        SELECT 
          at.*, 
          d.nombre, 
          d.correo, 
          d.asunto, 
          d.mensaje,
          u.full_name as admin_name
        FROM anonymous_tickets at
        LEFT JOIN donations d ON at.donation_id = d.id
        LEFT JOIN users u ON at.assigned_admin_id = u.id
        WHERE at.id = ?
      `, [id]);
      
      if ((tickets as any[]).length === 0) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      
      res.json((tickets as any[])[0]);
    } catch (error) {
      console.error('Error fetching anonymous ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update anonymous ticket (change status, assign admin)
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, assigned_admin_id }: UpdateAnonymousTicket = req.body;
      
      const updateFields: string[] = [];
      const values: any[] = [];
      
      // Handle status updates
      if (status !== undefined) {
        updateFields.push('status = ?');
        values.push(status);
        
        // Set closed_at timestamp when closing ticket
        if (status === 'closed') {
          updateFields.push('closed_at = CURRENT_TIMESTAMP');
        } else {
          updateFields.push('closed_at = NULL');
        }
        
        // Set archived_at timestamp when archiving ticket
        if (status === 'archived') {
          updateFields.push('archived_at = CURRENT_TIMESTAMP');
        } else {
          updateFields.push('archived_at = NULL');
        }
      }
      
      // Handle admin assignment
      if (assigned_admin_id !== undefined) {
        updateFields.push('assigned_admin_id = ?');
        values.push(assigned_admin_id);
      }
      
      // Validate that at least one field is being updated
      if (updateFields.length === 0) {
        res.status(400).json({ message: 'No fields provided for update' });
        return;
      }
      
      values.push(id);
      
      await db.execute(
        `UPDATE anonymous_tickets SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
      
      res.json({ message: 'Anonymous ticket updated successfully' });
    } catch (error) {
      console.error('Error updating anonymous ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Close an anonymous ticket
   */
  static async close(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await db.execute(
        'UPDATE anonymous_tickets SET status = "closed", closed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      
      res.json({ message: 'Anonymous ticket closed successfully' });
    } catch (error) {
      console.error('Error closing anonymous ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Archive an anonymous ticket
   */
  static async archive(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await db.execute(
        'UPDATE anonymous_tickets SET status = "archived", archived_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      
      res.json({ message: 'Anonymous ticket archived successfully' });
    } catch (error) {
      console.error('Error archiving anonymous ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get messages for an anonymous ticket
   */
  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      
      // First, get the numeric ID from the public ticket_id
      const [tickets] = await db.execute(
        'SELECT id FROM anonymous_tickets WHERE ticket_id = ?',
        [ticketId]
      );
      
      if ((tickets as any[]).length === 0) {
        res.status(404).json({ message: 'Anonymous ticket not found' });
        return;
      }
      
      const numericTicketId = (tickets as any[])[0].id;
      
      const [messages] = await db.execute(`
        SELECT 
          id,
          ticket_id,
          sender_type,
          message,
          timestamp as created_at
        FROM anonymous_ticket_messages 
        WHERE ticket_id = ? 
        ORDER BY timestamp ASC
      `, [numericTicketId]);
      
      res.json(messages);
    } catch (error) {
      console.error('Error fetching anonymous ticket messages:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Send a message for an anonymous ticket
   */
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { ticket_id, sender_type, message }: CreateAnonymousTicketMessage = req.body;
      
      // First, get the numeric ID from the public ticket_id
      const [tickets] = await db.execute(
        'SELECT id FROM anonymous_tickets WHERE ticket_id = ?',
        [ticket_id]
      );
      
      if ((tickets as any[]).length === 0) {
        res.status(404).json({ message: 'Anonymous ticket not found' });
        return;
      }
      
      const numericTicketId = (tickets as any[])[0].id;
      
      // Insert the message using the numeric ID
      await db.execute(
        'INSERT INTO anonymous_ticket_messages (ticket_id, sender_type, message) VALUES (?, ?, ?)',
        [numericTicketId, sender_type, message]
      );
      
      res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
      console.error('Error sending anonymous ticket message:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
