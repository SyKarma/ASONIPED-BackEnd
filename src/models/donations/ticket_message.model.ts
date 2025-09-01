/**
 * Interface representing a ticket message in the system
 * This is a generic message system that can be used across different modules
 */
export interface TicketMessage {
  /** Unique identifier for the message */
  id: number;
  /** Type of module this message belongs to (donations, records, volunteers, workshops) */
  module_type: 'donations' | 'records' | 'volunteers' | 'workshops';
  /** Reference to the specific ticket/record in the module */
  module_id: number;
  /** Reference to the user who sent the message */
  sender_id: number;
  /** Content of the message */
  message: string;
  /** Timestamp when the message was created */
  timestamp: Date;
}

/**
 * Interface for creating a new ticket message
 * Used when sending messages in ticket conversations
 */
export interface CreateTicketMessage {
  /** Type of module this message belongs to */
  module_type: 'donations' | 'records' | 'volunteers' | 'workshops';
  /** Reference to the specific ticket/record in the module */
  module_id: number;
  /** Reference to the user sending the message */
  sender_id: number;
  /** Content of the message to be sent */
  message: string;
}
