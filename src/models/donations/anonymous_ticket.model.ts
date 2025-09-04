export type TicketStatus = 'open' | 'closed' | 'archived';

export type SenderType = 'user' | 'admin';

export interface AnonymousTicket {

  id: number;
  ticket_id: string;
  donation_id: number;
  session_id: string | null;
  status: TicketStatus;
  created_at: Date;
  closed_at: Date | null;
  archived_at: Date | null;
  assigned_admin_id: number | null;
}


export interface AnonymousTicketWithDonation extends AnonymousTicket {

  nombre?: string;
  correo?: string;
  asunto?: string;
  mensaje?: string;
}


export interface AnonymousTicketWithAdmin extends AnonymousTicket {

  admin_name?: string;
}


export interface AnonymousTicketComplete extends AnonymousTicketWithDonation, AnonymousTicketWithAdmin {}


export interface CreateAnonymousTicket {

  donation_id: number;

  session_id?: string;
}


export interface UpdateAnonymousTicket {

  status?: TicketStatus;

  assigned_admin_id?: number;
}


export interface AnonymousTicketMessage {

  id: number;

  ticket_id: number;

  sender_type: SenderType;

  message: string;

  timestamp: Date;
}


export interface CreateAnonymousTicketMessage {

  ticket_id: number;

  sender_type: SenderType;

  message: string;
}


export type TicketStatusTransition = {
  from: TicketStatus;
  to: TicketStatus;
  allowed: boolean;
};


export type MessageFilter = {
  sender_type?: SenderType;
  date_from?: Date;
  date_to?: Date;
};
