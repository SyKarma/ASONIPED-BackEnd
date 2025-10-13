import { Request, Response } from 'express';
import { db } from '../../../db';
import { DonationTicket, CreateDonationTicket, UpdateDonationTicket } from '../models/donation_ticket.model';

export class DonationTicketController {

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { donation_id, user_id }: CreateDonationTicket = req.body;
      
      const [result] = await db.execute(
        'INSERT INTO donation_tickets (donation_id, user_id) VALUES (?, ?)',
        [donation_id, user_id]
      );
      
      res.status(201).json({ 
        message: 'Ticket created successfully',
        ticketId: (result as any).insertId 
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 Executing getAll tickets...');
      
      const [tickets] = await db.execute(`
        SELECT 
          dt.*, 
          d.nombre, 
          d.correo, 
          d.asunto, 
          u.full_name as user_name, 
          a.full_name as admin_name
        FROM donation_tickets dt
        LEFT JOIN donations d ON dt.donation_id = d.id
        LEFT JOIN users u ON dt.user_id = u.id
        LEFT JOIN users a ON dt.assigned_admin_id = a.id
        ORDER BY dt.created_at DESC
      `);
      
      console.log('📊 Tickets found:', (tickets as any[]).length);
      console.log('📋 Ticket data:', tickets);
      
      res.json(tickets);
    } catch (error) {
      console.error('❌ Error fetching tickets:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const [tickets] = await db.execute(`
        SELECT 
          dt.*, 
          d.nombre, 
          d.correo, 
          d.asunto, 
          a.full_name as admin_name
        FROM donation_tickets dt
        LEFT JOIN donations d ON dt.donation_id = d.id
        LEFT JOIN users a ON dt.assigned_admin_id = a.id
        WHERE dt.user_id = ?
        ORDER BY dt.created_at DESC
      `, [userId]);
      
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }


  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const [tickets] = await db.execute(`
        SELECT 
          dt.*, 
          d.nombre, 
          d.correo, 
          d.asunto, 
          d.mensaje, 
          u.full_name as user_name, 
          a.full_name as admin_name
        FROM donation_tickets dt
        LEFT JOIN donations d ON dt.donation_id = d.id
        LEFT JOIN users u ON dt.user_id = u.id
        LEFT JOIN users a ON dt.assigned_admin_id = a.id
        WHERE dt.id = ?
      `, [id]);
      
      if ((tickets as any[]).length === 0) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      
      res.json((tickets as any[])[0]);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }


  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, assigned_admin_id }: UpdateDonationTicket = req.body;
      
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
        `UPDATE donation_tickets SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
      
      res.json({ message: 'Ticket updated successfully' });
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }


  static async close(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await db.execute(
        'UPDATE donation_tickets SET status = "closed", closed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      
      res.json({ message: 'Ticket closed successfully' });
    } catch (error) {
      console.error('Error closing ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }


  static async archive(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await db.execute(
        'UPDATE donation_tickets SET status = "archived", archived_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      
      res.json({ message: 'Ticket archived successfully' });
    } catch (error) {
      console.error('Error archiving ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
