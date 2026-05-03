export interface Ticket {
  id: string;
  passenger_name: string;
  passenger_phone: string;
  from_location: string;
  to_location: string;
  departure_date: string;
  departure_time: string;
  seats_count: number;
  total_amount: number;
  payment_method: string;
  bus_plate?: string;
  driver_name?: string;
  issued_by?: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export type PrintSize = '58mm' | '80mm' | 'a4';

export interface PrintSizeOption {
  id: PrintSize;
  label: string;
  description: string;
  preview: string;
}

export interface PrintTicketResponse {
  html: string;
}