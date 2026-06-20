import { apiClient } from './client';
import { PrintSize } from '../types/ticket';

export interface ApiTicket {
  id: string;
  ticket_number?: string;
  passenger_name: string;
  phone: string;
  boarding_stop: { id: string; name: string };
  alighting_stop: { id: string; name: string };
  seats_count: number;
  amount: number;
  currency?: string;
  payment_method: string;
  status: string;
  booked_at: string;
  created_at?: string;
  updated_at?: string;
  trip?: {
    id: string;
    departure_at?: string;
    route?: { id: string; name: string };
    bus?: { id: string; plate: string; type?: string } | null;
    driver?: { first_name: string; last_name: string } | null;
  };
  org?: { id: string; name: string };
  issued_by?: { first_name: string; last_name: string } | string | null;
}

const unwrapTicketRaw = (response: any, fallbackId?: string): any => {
  if (!response) return { id: fallbackId };

  let raw = response;
  if (raw.data && !Array.isArray(raw.data)) {
    raw = raw.data.ticket ?? raw.data;
  } else if (raw.ticket) {
    raw = raw.ticket;
  }

  if (fallbackId && !raw.id) {
    return { ...raw, id: fallbackId };
  }

  return raw;
};

const normalizeStop = (stop: any, fallbackName?: string) => {
  if (stop && typeof stop === 'object') {
    return {
      id: stop.id ?? stop.location_id ?? '',
      name: stop.name ?? fallbackName ?? '—',
    };
  }
  return { id: '', name: fallbackName ?? '—' };
};

const normalizeTicket = (raw: any, fallbackId?: string): ApiTicket => ({
  id: raw.id ?? raw.ticket_id ?? fallbackId ?? '',
  ticket_number: raw.ticket_number ?? raw.reference ?? raw.ticketNumber,
  passenger_name: raw.passenger_name ?? raw.passengerName ?? '',
  phone: raw.phone ?? raw.passenger_phone ?? raw.phone_number ?? raw.passengerPhone ?? '',
  boarding_stop: normalizeStop(
    raw.boarding_stop ?? raw.boardingStop,
    raw.boarding_stop_name ?? raw.from_location ?? raw.from_stop,
  ),
  alighting_stop: normalizeStop(
    raw.alighting_stop ?? raw.alightingStop,
    raw.alighting_stop_name ?? raw.to_location ?? raw.to_stop,
  ),
  seats_count: raw.seats_count ?? raw.seat_count ?? raw.seats ?? raw.seat_number ?? 1,
  amount: raw.amount ?? raw.total_amount ?? raw.price ?? 0,
  currency: raw.currency ?? 'RWF',
  payment_method: raw.payment_method ?? raw.paymentMethod ?? '—',
  status: raw.status ?? 'pending',
  booked_at: raw.booked_at ?? raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  created_at: raw.created_at ?? raw.createdAt,
  updated_at: raw.updated_at ?? raw.updatedAt,
  trip: raw.trip
    ? {
        id: raw.trip.id,
        departure_at: raw.trip.departure_at ?? raw.trip.departureAt,
        route: raw.trip.route,
        bus: raw.trip.bus ?? null,
        driver: raw.trip.driver ?? null,
      }
    : undefined,
  org: raw.org ?? raw.organization,
  issued_by: raw.issued_by ?? raw.issuedBy ?? null,
});

export const getTickets = async (params?: {
  q?: string;
  search?: string;
  trip_id?: string;
  org_id?: string;
  status?: string;
  limit?: number;
}) => {
  const allTickets: ApiTicket[] = [];
  let page = 1;
  let total = 0;
  const limit = params?.limit ?? 100;
  const searchTerm = params?.search ?? params?.q;

  do {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (searchTerm) {
      searchParams.append('search', searchTerm);
      searchParams.append('q', searchTerm);
    }
    if (params?.trip_id) searchParams.append('trip_id', params.trip_id);
    if (params?.org_id) searchParams.append('org_id', params.org_id);
    if (params?.status) searchParams.append('status', params.status);

    const response = await apiClient(`/tickets?${searchParams.toString()}`, {
      method: 'GET',
    });

    let batch: any[] = [];
    if (response?.data && Array.isArray(response.data)) {
      batch = response.data;
      total = response.total ?? batch.length;
    } else if (response?.tickets && Array.isArray(response.tickets)) {
      batch = response.tickets;
      total = batch.length;
    } else if (Array.isArray(response)) {
      batch = response;
      total = batch.length;
    }

    allTickets.push(...batch.map(normalizeTicket));
    page += 1;
  } while (allTickets.length < total);

  return allTickets;
};

export const getTicketsCount = async (params?: { org_id?: string; status?: string }) => {
  const searchParams = new URLSearchParams({ page: '1', limit: '1' });
  if (params?.org_id) searchParams.append('org_id', params.org_id);
  if (params?.status) searchParams.append('status', params.status);

  const response = await apiClient(`/tickets?${searchParams.toString()}`, {
    method: 'GET',
  });

  return response?.total ?? response?.data?.length ?? 0;
};

export const getTicketById = async (ticketId: string): Promise<ApiTicket> => {
  const response = await apiClient(`/tickets/${ticketId}`, { method: 'GET' });
  return normalizeTicket(unwrapTicketRaw(response, ticketId), ticketId);
};

export const createTicket = async (ticketData: {
  trip_id: string;
  passenger_name: string;
  phone: string;
  boarding_stop_id: string;
  alighting_stop_id: string;
  seats_count?: number;
  amount: number;
  payment_method: string;
  org_id?: string;
}) => {
  const response = await apiClient('/tickets', {
    method: 'POST',
    body: ticketData,
  });
  return normalizeTicket(unwrapTicketRaw(response));
};

export const updateTicket = async (
  ticketId: string,
  ticketData: {
    passenger_name?: string;
    phone?: string;
    seats_count?: number;
    amount?: number;
    payment_method?: string;
    status?: string;
  },
) => {
  const response = await apiClient(`/tickets/${ticketId}`, {
    method: 'PATCH',
    body: ticketData,
  });
  return normalizeTicket(unwrapTicketRaw(response, ticketId), ticketId);
};

export const cancelTicket = async (ticketId: string) => {
  return updateTicket(ticketId, { status: 'cancelled' });
};

export const deleteTicket = async (ticketId: string) => {
  return apiClient(`/tickets/${ticketId}`, { method: 'DELETE' });
};

export const getTicketPrintHtml = async (ticketId: string, size: PrintSize): Promise<string> => {
  try {
    const response = await apiClient(`/tickets/${ticketId}/print?size=${size}`, {
      method: 'GET',
    });

    if (typeof response === 'string' && response.trim()) {
      return response;
    }
    if (response?.html) {
      return response.html;
    }
    if (response?.data?.html) {
      return response.data.html;
    }
  } catch {
    // Fall back to client-generated receipt below
  }

  const ticket = await getTicketById(ticketId);
  return generateTicketPrintHtml(ticket, size);
};

export const generateTicketPrintHtml = (ticket: ApiTicket, size: PrintSize): string => {
  const qrCodePlaceholder =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5RUiBDb2RlPC90ZXh0Pjwvc3ZnPg==';
  const logoPlaceholder =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDA3N2ZmIi8+PHRleHQgeD0iMzAiIHk9IjI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxvZ288L3RleHQ+PC9zdmc+';

  const sizeStyles: Record<PrintSize, { width: string; pageSize: string; qrSize: string; logoMaxWidth: string; wrapperStyle?: string }> = {
    '58mm': { width: '58mm', pageSize: '58mm auto', qrSize: '30mm', logoMaxWidth: '25mm' },
    '80mm': { width: '80mm', pageSize: '80mm auto', qrSize: '40mm', logoMaxWidth: '35mm' },
    a4: { width: '210mm', pageSize: 'a4', qrSize: '50mm', logoMaxWidth: '50mm', wrapperStyle: 'max-width: 80mm; margin: 20mm auto;' },
  };

  const currentSize = sizeStyles[size];
  const departure = ticket.trip?.departure_at ? new Date(ticket.trip.departure_at) : null;
  const orgName = ticket.org?.name ?? 'Katisha Operator';
  const busPlate = ticket.trip?.bus?.plate;
  const driverName = ticket.trip?.driver
    ? `${ticket.trip.driver.first_name} ${ticket.trip.driver.last_name}`.trim()
    : undefined;
  const issuedBy =
    typeof ticket.issued_by === 'string'
      ? ticket.issued_by
      : ticket.issued_by
        ? `${ticket.issued_by.first_name} ${ticket.issued_by.last_name}`.trim()
        : undefined;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket - ${ticket.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 11px; background: #fff; color: #000; width: ${currentSize.width}; margin: 0 auto; padding: 10px; }
    .receipt-wrapper { ${size === 'a4' ? currentSize.wrapperStyle : ''} }
    .receipt { width: 100%; padding: 4mm; }
    .logo { display: block; max-width: ${currentSize.logoMaxWidth}; margin: 0 auto 2mm; }
    .company-name { text-align: center; font-size: 13px; font-weight: bold; margin-bottom: 3mm; }
    .divider { border-top: 1px dashed #000; margin: 2mm 0; }
    .title { text-align: center; font-size: 12px; font-weight: bold; letter-spacing: 2px; margin: 2mm 0; }
    .row { display: flex; justify-content: space-between; margin: 1mm 0; }
    .label { color: #555; }
    .qr-wrapper { text-align: center; margin: 3mm 0; }
    .qr-wrapper img { width: ${currentSize.qrSize}; height: ${currentSize.qrSize}; }
    .ticket-id { text-align: center; font-size: 9px; color: #555; margin-bottom: 3mm; }
    .powered-by { text-align: center; font-size: 8px; color: #999; margin-top: 3mm; }
    @media print { body { margin: 0; padding: 0; } @page { margin: 0; size: ${currentSize.pageSize}; } }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    <div class="receipt">
      <img class="logo" src="${logoPlaceholder}" alt="${orgName}" />
      <div class="company-name">${orgName}</div>
      <div class="divider"></div>
      <div class="title">TICKET</div>
      <div class="divider"></div>
      <div class="row"><span class="label">Passenger</span><span>${ticket.passenger_name}</span></div>
      <div class="row"><span class="label">Phone</span><span>${ticket.phone}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">From</span><span>${ticket.boarding_stop.name}</span></div>
      <div class="row"><span class="label">To</span><span>${ticket.alighting_stop.name}</span></div>
      ${departure ? `<div class="row"><span class="label">Date</span><span>${departure.toLocaleDateString('en-GB')}</span></div>` : ''}
      ${departure ? `<div class="row"><span class="label">Time</span><span>${departure.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></div>` : ''}
      <div class="divider"></div>
      <div class="row"><span class="label">Seats</span><span>${ticket.seats_count}</span></div>
      <div class="row"><span class="label">Amount</span><span>${ticket.currency ?? 'RWF'} ${Number(ticket.amount).toLocaleString()}</span></div>
      <div class="row"><span class="label">Method</span><span>${ticket.payment_method}</span></div>
      <div class="divider"></div>
      ${busPlate ? `<div class="row"><span class="label">Bus</span><span>${busPlate}</span></div>` : ''}
      ${driverName ? `<div class="row"><span class="label">Driver</span><span>${driverName}</span></div>` : ''}
      ${issuedBy ? `<div class="row"><span class="label">Issued by</span><span>${issuedBy}</span></div>` : ''}
      <div class="divider"></div>
      <div class="qr-wrapper"><img src="${qrCodePlaceholder}" alt="Scan to verify ticket" /></div>
      <div class="ticket-id">${ticket.ticket_number ?? ticket.id}</div>
      <div class="divider"></div>
      <div class="powered-by">powered by katisha online</div>
    </div>
  </div>
</body>
</html>`;
};
