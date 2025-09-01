/**
 * Interface representing a donation ticket in the system
 */
export interface DonationTicket {
  /** Unique identifier for the ticket */
  id: number;
  /** Reference to the associated donation */
  donation_id: number;
  /** Reference to the user who created the ticket */
  user_id: number | null;
  /** Current status of the ticket */
  status: 'open' | 'closed';
  /** Timestamp when the ticket was created */
  created_at: Date;
  /** Timestamp when the ticket was closed (null if still open) */
  closed_at: Date | null;
  /** Reference to the admin assigned to handle the ticket */
  assigned_admin_id: number | null;
}

/**
 * Interface for creating a new donation ticket
 */
export interface CreateDonationTicket {
  /** Reference to the associated donation */
  donation_id: number;
  /** Reference to the user creating the ticket (optional) */
  user_id?: number;
}

/**
 * Interface for updating an existing donation ticket
 */
export interface UpdateDonationTicket {
  /** New status for the ticket */
  status?: 'open' | 'closed';
  /** Admin to assign to the ticket */
  assigned_admin_id?: number;
}
