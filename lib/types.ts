// ============================================================
// Alpha360 SaaS — Type Definitions
// All Firestore collection types
// ============================================================

import { Timestamp } from 'firebase/firestore';

// ---- Company (Multi-tenant) ----
export interface Company {
  id?: string;
  name: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  ownerId: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  createdAt: string | Timestamp;
}

// ---- User ----
export type UserRole = 'admin' | 'client' | 'guard' | 'user';

export interface UserData {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  address?: string;
  age?: string | number;
  height?: string | number;
  rank?: 'Júnior' | 'Pleno' | 'Sênior';
  status?: 'Ativo' | 'Inativo' | 'Em Intervalo' | 'Offline' | 'On Duty';
  performance?: number;
  photoUrl?: string;
  lat?: number;
  lng?: number;
  lastLocationUpdate?: string;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'email' | 'phone' | 'random';
  averageRating?: number;
  totalRatings?: number;
  createdAt: string | Timestamp;
}

// ---- Job (Escala) ----
export type JobStatus = 'open' | 'filled' | 'in_progress' | 'completed' | 'cancelled';

export interface Job {
  id?: string;
  companyId: string;
  contractorId: string;
  siteId?: string;
  clientName: string;
  location: string;
  mapLink?: string;
  lat?: number;
  lng?: number;
  date: string;
  startTime: string;
  endTime: string;
  dailyRate: number;
  guardsNeeded: number;
  guardsConfirmed: number;
  hasQRF: boolean;
  hasHydration: boolean;
  isPatrimonial?: boolean;
  status: JobStatus;
  qrCheckinToken?: string;
  qrCheckoutToken?: string;
  qrExpiresAt?: string;
  description?: string;
  createdAt: string | Timestamp;
}

// ---- Job Assignment ----
export type AssignmentStatus = 'pending' | 'approved' | 'rejected' | 'checked_in' | 'checked_out';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface JobAssignment {
  id?: string;
  jobId: string;
  guardId: string;
  guardName: string;
  guardPhoto?: string;
  companyId: string;
  status: AssignmentStatus;
  checkinAt?: string;
  checkoutAt?: string;
  checkinLat?: number;
  checkinLng?: number;
  checkoutLat?: number;
  checkoutLng?: number;
  totalHours?: number;
  dailyRate: number;
  paymentStatus: PaymentStatus;
  pixTransactionId?: string;
  rating?: number;
  ratingComment?: string;
  createdAt: string | Timestamp;
}

// ---- Location (tracking history) ----
export type LocationStatus = 'active' | 'idle' | 'sos' | 'relief' | 'hydration';

export interface LocationEntry {
  id?: string;
  guardId: string;
  guardName?: string;
  jobId?: string;
  companyId?: string;
  lat: number;
  lng: number;
  status: LocationStatus;
  timestamp: string | Timestamp;
}

// ---- Alert ----
export type AlertType = 'sos' | 'relief' | 'hydration' | 'geofence' | 'checkin' | 'checkout' | 'job_accepted' | 'arrival';
export type AlertStatus = 'active' | 'dispatching' | 'resolved';

export interface Alert {
  id?: string;
  type: AlertType;
  jobId?: string;
  guardId?: string;
  guardName?: string;
  companyId?: string;
  contractorId?: string;
  lat?: number;
  lng?: number;
  message: string;
  status: AlertStatus;
  createdAt: string | Timestamp;
}

// ---- Message (Chat) ----
export interface Message {
  id?: string;
  jobId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderPhoto?: string;
  text: string;
  imageUrl?: string;
  createdAt: string | Timestamp;
}

// ---- Site (Posto) ----
export type SiteStatus = 'Ativo' | 'Inativo' | 'Manutenção';

export interface Site {
  id?: string;
  companyId: string;
  name: string;
  address: string;
  client?: string;
  lat?: number;
  lng?: number;
  guardsAssigned?: number;
  status: SiteStatus;
  lastAudit?: string;
  imageUrl?: string;
  geofenceRadius?: number; // meters
  createdAt: string | Timestamp;
}

// ---- QR Code Data ----
export interface QRCodeData {
  type: 'checkin' | 'checkout';
  jobId: string;
  token: string;
  expiresAt: string;
}

// ---- Payment / PIX ----
export interface PixPayment {
  id?: string;
  assignmentId: string;
  guardId: string;
  guardName: string;
  amount: number;
  pixKey: string;
  pixKeyType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  processedAt?: string;
  createdAt: string | Timestamp;
}

// ---- Guard Rating ----
export interface GuardRating {
  id?: string;
  guardId: string;
  jobId: string;
  assignmentId: string;
  ratedBy: string;
  ratedByName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string | Timestamp;
}

// ---- SaaS Plan ----
export interface SaaSPlan {
  id: string;
  name: string;
  price: number;
  maxGuards: number;
  maxJobs: number;
  features: string[];
  isPopular?: boolean;
}

// ---- Dashboard Stats (computed) ----
export interface DashboardStats {
  guardsOnDuty: number;
  activeSites: number;
  openJobs: number;
  activeAlerts: number;
  totalRevenue: number;
  completedJobs: number;
}
