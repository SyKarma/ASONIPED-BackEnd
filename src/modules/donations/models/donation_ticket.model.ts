export interface DonationTicket {
  id: number;
  donation_id: number;
  user_id: number | null;
  status: 'open' | 'closed' | 'archived';
  created_at: Date;
  closed_at: Date | null;
  archived_at: Date | null;
  assigned_admin_id: number | null;
}

export interface CreateDonationTicket {
  donation_id: number;
  user_id?: number;
}


export interface UpdateDonationTicket {
  status?: 'open' | 'closed' | 'archived';
  assigned_admin_id?: number;
}
