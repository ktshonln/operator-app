// Mock data for Locations, Routes, Prices, and Trips

export interface Location {
  id: string;
  name: string;
  city?: string;  // API returns 'city'
  province?: string;  // Keep for backward compatibility
  lat: number;
  lng: number;
  created_at?: string;
  updated_at?: string;
}

export interface RouteStop {
  id: string;
  location_id: string;
  name: string;
  order: number;
}

export interface Route {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  stops_count: number;
  origin?: { id: string; name: string };
  destination?: { id: string; name: string };
  org?: { id: string; name: string } | null;
  prices_complete?: boolean;
  stops?: RouteStop[];
  created_at: string;
}

export interface Price {
  id: string;
  boarding_stop: { id: string; name: string };
  alighting_stop: { id: string; name: string };
  amount: number;
  currency?: string;
}

export interface Trip {
  id: string;
  departure_at: string;
  status: 'scheduled' | 'active' | 'in_progress' | 'completed' | 'cancelled' | string;
  is_express: boolean;
  total_seats: number;
  booked_seats: number;
  remaining_seats: number;
  route: { id: string; name: string };
  bus: { id: string; plate: string; type: string };
  driver?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_path: string | null;
  } | null;
  series: {
    id: string;
    frequency_minutes: number;
    repeat_daily: boolean;
    starts_on: string;
    ends_on: string;
    is_only_in_series: boolean;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  passenger_name: string;
  phone: string;
  boarding_stop: string;
  alighting_stop: string;
  seat_number: number;
  status: 'confirmed' | 'cancelled';
}

export interface Bus {
  id: string;
  plate: string;
  type: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive' | string;
  driver: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_path: string | null;
  } | null;
  org?: { id: string; name: string } | null;
  device_id?: string;
  routes?: Array<{ id: string; name: string }>;
  created_at: string;
  updated_at?: string;
}

// ── Trips ──────────────────────────────────────────────────────────────────
const today = new Date();
const d = (offsetDays: number, hour: number, min = 0) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(hour, min, 0, 0);
  return dt.toISOString();
};

export const MOCK_TRIPS: Trip[] = [
  { id: 'trip-1', departure_at: d(0, 6), status: 'scheduled', is_express: false, total_seats: 30, booked_seats: 12, remaining_seats: 18, route: { id: 'route-1', name: 'Kigali — Gisenyi' }, bus: { id: 'bus-1', plate: 'RAA 001 A', type: 'Coach' }, series: { id: 'ser-1', frequency_minutes: 120, repeat_daily: true, starts_on: '2026-04-20', ends_on: '2026-05-20', is_only_in_series: false }, created_at: d(0, 6), updated_at: d(0, 6) },
  { id: 'trip-2', departure_at: d(0, 8), status: 'in_progress', is_express: true, total_seats: 30, booked_seats: 28, remaining_seats: 2, route: { id: 'route-1', name: 'Kigali — Gisenyi' }, bus: { id: 'bus-2', plate: 'RAB 002 B', type: 'Mini' }, series: null, created_at: d(0, 8), updated_at: d(0, 8) },
  { id: 'trip-3', departure_at: d(0, 10), status: 'scheduled', is_express: false, total_seats: 45, booked_seats: 5, remaining_seats: 40, route: { id: 'route-2', name: 'Kigali — Huye' }, bus: { id: 'bus-3', plate: 'RAC 003 C', type: 'Coach' }, series: { id: 'ser-2', frequency_minutes: 180, repeat_daily: true, starts_on: '2026-04-20', ends_on: '2026-05-20', is_only_in_series: false }, created_at: d(0, 10), updated_at: d(0, 10) },
  { id: 'trip-4', departure_at: d(0, 14), status: 'scheduled', is_express: false, total_seats: 30, booked_seats: 20, remaining_seats: 10, route: { id: 'route-1', name: 'Kigali — Gisenyi' }, bus: { id: 'bus-1', plate: 'RAA 001 A', type: 'Coach' }, series: { id: 'ser-1', frequency_minutes: 120, repeat_daily: true, starts_on: '2026-04-20', ends_on: '2026-05-20', is_only_in_series: false }, created_at: d(0, 14), updated_at: d(0, 14) },
  { id: 'trip-5', departure_at: d(1, 6), status: 'scheduled', is_express: false, total_seats: 30, booked_seats: 0, remaining_seats: 30, route: { id: 'route-1', name: 'Kigali — Gisenyi' }, bus: { id: 'bus-2', plate: 'RAB 002 B', type: 'Mini' }, series: { id: 'ser-1', frequency_minutes: 120, repeat_daily: true, starts_on: '2026-04-20', ends_on: '2026-05-20', is_only_in_series: false }, created_at: d(1, 6), updated_at: d(1, 6) },
  { id: 'trip-6', departure_at: d(1, 9), status: 'scheduled', is_express: true, total_seats: 30, booked_seats: 15, remaining_seats: 15, route: { id: 'route-2', name: 'Kigali — Huye' }, bus: { id: 'bus-3', plate: 'RAC 003 C', type: 'Coach' }, series: null, created_at: d(1, 9), updated_at: d(1, 9) },
  { id: 'trip-7', departure_at: d(-1, 7), status: 'completed', is_express: false, total_seats: 30, booked_seats: 30, remaining_seats: 0, route: { id: 'route-1', name: 'Kigali — Gisenyi' }, bus: { id: 'bus-1', plate: 'RAA 001 A', type: 'Coach' }, series: null, created_at: d(-1, 7), updated_at: d(-1, 7) },
];

export const MOCK_BOOKINGS: Booking[] = [
  { id: 'bk-1', passenger_name: 'Alice Uwase', phone: '0780000001', boarding_stop: 'Kigali', alighting_stop: 'Gisenyi', seat_number: 1, status: 'confirmed' },
  { id: 'bk-2', passenger_name: 'Bob Nkurunziza', phone: '0780000002', boarding_stop: 'Kigali', alighting_stop: 'Musanze', seat_number: 2, status: 'confirmed' },
  { id: 'bk-3', passenger_name: 'Claire Mukamana', phone: '0780000003', boarding_stop: 'Musanze', alighting_stop: 'Gisenyi', seat_number: 3, status: 'confirmed' },
  { id: 'bk-4', passenger_name: 'David Habimana', phone: '0780000004', boarding_stop: 'Kigali', alighting_stop: 'Gisenyi', seat_number: 4, status: 'cancelled' },
];

// ── Buses ──────────────────────────────────────────────────────────────────
export const MOCK_BUSES: Bus[] = [
  { id: 'bus-1', plate: 'RAA 001 A', type: 'Coach', capacity: 30, status: 'active', driver: { id: 'drv-1', first_name: 'Jean', last_name: 'Uwimana', avatar_path: null }, org: { id: 'org-1', name: 'Volcano Express' }, created_at: '2026-04-20T08:00:00Z' },
  { id: 'bus-2', plate: 'RAB 002 B', type: 'Mini', capacity: 14, status: 'active', driver: { id: 'drv-2', first_name: 'Alice', last_name: 'Mukamana', avatar_path: null }, org: { id: 'org-1', name: 'Volcano Express' }, created_at: '2026-04-20T08:00:00Z' },
  { id: 'bus-3', plate: 'RAC 003 C', type: 'Coach', capacity: 45, status: 'maintenance', driver: null, org: { id: 'org-1', name: 'Volcano Express' }, created_at: '2026-04-20T08:00:00Z' },
  { id: 'bus-4', plate: 'RAD 004 D', type: 'Sprinter', capacity: 20, status: 'active', driver: { id: 'drv-3', first_name: 'Eric', last_name: 'Habimana', avatar_path: null }, org: { id: 'org-1', name: 'Volcano Express' }, created_at: '2026-04-20T08:00:00Z' },
  { id: 'bus-5', plate: 'RAE 005 E', type: 'Mini', capacity: 14, status: 'inactive', driver: null, org: { id: 'org-1', name: 'Volcano Express' }, created_at: '2026-04-20T08:00:00Z' },
  { id: 'bus-6', plate: 'RAF 006 F', type: 'Coach', capacity: 30, status: 'active', driver: { id: 'drv-4', first_name: 'Marie', last_name: 'Ingabire', avatar_path: null }, org: { id: 'org-1', name: 'Volcano Express' }, created_at: '2026-04-20T08:00:00Z' },
  { id: 'bus-7', plate: 'RAG 007 G', type: 'Sprinter', capacity: 20, status: 'active', driver: { id: 'drv-5', first_name: 'Paul', last_name: 'Nkurunziza', avatar_path: null }, org: { id: 'org-1', name: 'Volcano Express' }, created_at: '2026-04-20T08:00:00Z' },
  { id: 'bus-8', plate: 'RAH 008 H', type: 'Coach', capacity: 45, status: 'active', driver: { id: 'drv-6', first_name: 'Grace', last_name: 'Uwase', avatar_path: null }, org: { id: 'org-1', name: 'Volcano Express' }, created_at: '2026-04-20T08:00:00Z' },
];

// ── Tickets ────────────────────────────────────────────────────────────────
export interface MockTicket {
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
  trip_id: string;
}

export const MOCK_TICKETS: MockTicket[] = [
  {
    id: 'ticket-1',
    passenger_name: 'Kalisa Nkusi',
    passenger_phone: '+250788***456',
    from_location: 'Kigali',
    to_location: 'Musanze',
    departure_date: '20 Apr 2026',
    departure_time: '08:00 AM',
    seats_count: 2,
    total_amount: 4000,
    payment_method: 'Cash',
    bus_plate: 'RAA 001 A',
    driver_name: 'Jean Uwimana',
    issued_by: 'Alice M.',
    created_at: '2026-04-20T06:30:00Z',
    updated_at: '2026-04-20T06:30:00Z',
    status: 'confirmed',
    trip_id: 'trip-1',
  },
  {
    id: 'ticket-2',
    passenger_name: 'Marie Uwase',
    passenger_phone: '+250788***789',
    from_location: 'Kigali',
    to_location: 'Gisenyi',
    departure_date: '20 Apr 2026',
    departure_time: '10:00 AM',
    seats_count: 1,
    total_amount: 4000,
    payment_method: 'Mobile Money',
    bus_plate: 'RAB 002 B',
    driver_name: 'Alice Mukamana',
    created_at: '2026-04-20T09:15:00Z',
    updated_at: '2026-04-20T09:15:00Z',
    status: 'confirmed',
    trip_id: 'trip-2',
  },
  {
    id: 'ticket-3',
    passenger_name: 'Eric Habimana',
    passenger_phone: '+250788***123',
    from_location: 'Kigali',
    to_location: 'Huye',
    departure_date: '20 Apr 2026',
    departure_time: '11:15 AM',
    seats_count: 1,
    total_amount: 3000,
    payment_method: 'Card',
    bus_plate: 'RAC 003 C',
    created_at: '2026-04-20T10:45:00Z',
    updated_at: '2026-04-20T10:45:00Z',
    status: 'completed',
    trip_id: 'trip-3',
  },
];
