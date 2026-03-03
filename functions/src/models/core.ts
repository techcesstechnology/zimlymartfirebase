import { Timestamp } from 'firebase-admin/firestore';

export interface Location {
  id: string;
  name: string;
  province: string;
  country: string;
  isActive: boolean;
  deliveryZones: DeliveryZone[];
  currency: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  estimatedDays: string; // e.g., "1-2 days"
}

export interface Store {
  id: string;
  locationId: string;
  name: string;
  address: string;
  isActive: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'customer' | 'admin' | 'driver';
  createdAt: Timestamp;
}
