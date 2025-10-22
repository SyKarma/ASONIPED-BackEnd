export interface TicketMessage {
  id: number;
  module_type: 'donations' | 'records' | 'volunteers' | 'workshops';
  module_id: number;
  sender_id: number;
  message: string;
  timestamp: Date;
}

export interface CreateTicketMessage {
  module_type: 'donations' | 'records' | 'volunteers' | 'workshops';
  module_id: number;
  sender_id: number;
  message: string;
}
