// Mock data for Locations, Routes, Prices, and Trips

export interface Location {
  id: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  created_at: string;
  updated_at: string;
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
  origin: { id: string; name: string };
  destination: { id: string; name: string };
  org: { id: string; name: string };
  prices_complete: boolean;
  stops: RouteStop[];
  created_at: string;
}

export interface Price {
  id: string;
  boarding_stop: { id: string; name: string };
  alighting_stop: { id: string; name: string };
  amount: number;
}

export interface Trip {
  id: string;
  departure_at: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  is_express: boolean;
  total_seats: number;
  booked_seats: number;
  remaining_seats: number;
  route: { id: string; name: string };
  bus: { id: string; plate: string; type: string };
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
  type: 'Coach' | 'Mini' | 'Sprinter';
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  driver: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_path: string | null;
  } | null;
  org: { id: string; name: string };
  created_at: string;
}

// ── Locations ──────────────────────────────────────────────────────────────
export const MOCK_LOCATIONS: Location[] = [
  { id: 'loc-1', name: 'Kigali', province: 'Kigali City', lat: -1.9441, lng: 30.0619, created_at: '2026-04-20T08:00:00Z', updated_at: '2026-04-20T08:00:00Z' },
  { id: 'loc-2', name: 'Musanze', province: 'Northern Province', lat: -1.4989, lng: 29.6340, created_at: '2026-04-20T08:00:00Z', updated_at: '2026-04-20T08:00:00Z' },
  { id: 'loc-3', name: 'Gisenyi', province: 'Western Province', lat: -1.7028, lng: 29.2567, created_at: '2026-04-20T08:00:00Z', updated_at: '2026-04-20T08:00:00Z' },
  { id: 'loc-4', name: 'Huye', province: 'Southern Province', lat: -2.5967, lng: 29.7394, created_at: '2026-04-20T08:00:00Z', updated_at: '2026-04-20T08:00:00Z' },
  { id: 'loc-5', name: 'Rubavu', province: 'Western Province', lat: -1.6833, lng: 29.2500, created_at: '2026-04-20T08:00:00Z', updated_at: '2026-04-20T08:00:00Z' },
  { id: 'loc-6', name: 'Nyagatare', province: 'Eastern Province', lat: -1.2986, lng: 30.3278, created_at: '2026-04-20T08:00:00Z', updated_at: '2026-04-20T08:00:00Z' },
];

// ── Routes ─────────────────────────────────────────────────────────────────
export const MOCK_ROUTES: Route[] = [
  {
    id: 'route-1', name: 'Kigali — Gisenyi', status: 'active', stops_count: 3,
    origin: { id: 'loc-1', name: 'Kigali' }, destination: { id: 'loc-3', name: 'Gisenyi' },
    org: { id: 'org-1', name: 'Volcano Express' }, prices_complete: true,
    stops: [
      { id: 'rs-1', location_id: 'loc-1', name: 'Kigali', order: 1 },
      { id: 'rs-2', location_id: 'loc-2', name: 'Musanze', order: 2 },
      { id: 'rs-3', location_id: 'loc-3', name: 'Gisenyi', order: 3 },
    ],
    created_at: '2026-04-20T08:00:00Z',
  },
  {
    id: 'route-2', name: 'Kigali — Huye', status: 'active', stops_count: 2,
    origin: { id: 'loc-1', name: 'Kigali' }, destination: { id: 'loc-4', name: 'Huye' },
    org: { id: 'org-1', name: 'Volcano Express' }, prices_complete: false,
    stops: [
      { id: 'rs-4', location_id: 'loc-1', name: 'Kigali', order: 1 },
      { id: 'rs-5', location_id: 'loc-4', name: 'Huye', order: 2 },
    ],
    created_at: '2026-04-20T08:00:00Z',
  },
  {
    id: 'route-3', name: 'Kigali — Nyagatare', status: 'inactive', stops_count: 2,
    origin: { id: 'loc-1', name: 'Kigali' }, destination: { id: 'loc-6', name: 'Nyagatare' },
    org: { id: 'org-1', name: 'Volcano Express' }, prices_complete: false,
    stops: [
      { id: 'rs-6', location_id: 'loc-1', name: 'Kigali', order: 1 },
      { id: 'rs-7', location_id: 'loc-6', name: 'Nyagatare', order: 2 },
    ],
    created_at: '2026-04-20T08:00:00Z',
  },
];

// ── Prices ─────────────────────────────────────────────────────────────────
export const MOCK_PRICES: Price[] = [
  { id: 'p-1', boarding_stop: { id: 'loc-1', name: 'Kigali' }, alighting_stop: { id: 'loc-2', name: 'Musanze' }, amount: 2500 },
  { id: 'p-2', boarding_stop: { id: 'loc-1', name: 'Kigali' }, alighting_stop: { id: 'loc-3', name: 'Gisenyi' }, amount: 4000 },
  { id: 'p-3', boarding_stop: { id: 'loc-2', name: 'Musanze' }, alighting_stop: { id: 'loc-3', name: 'Gisenyi' }, amount: 1500 },
  { id: 'p-4', boarding_stop: { id: 'loc-3', name: 'Gisenyi' }, alighting_stop: { id: 'loc-1', name: 'Kigali' }, amount: 4000 },
  { id: 'p-5', boarding_stop: { id: 'loc-1', name: 'Kigali' }, alighting_stop: { id: 'loc-4', name: 'Huye' }, amount: 3000 },
];

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
