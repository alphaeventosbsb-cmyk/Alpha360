// ============================================================
// Alpha360 SaaS — Type Definitions (Shared)
// All Firestore collection types — NO Firebase dependency
// ============================================================

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
  createdAt: string;
}

// ---- User ----
export type UserRole = 'admin' | 'client' | 'guard' | 'user';

export interface UserData {
  id?: string;
  email: string;
  name: string; // NOME COMPLETO
  role: UserRole;
  companyId?: string;

  // Documentos Pessoais & Características (Anexo 2)
  birthDate?: string;
  birthPlace?: string; // NATURALIDADE
  gender?: string; // SEXO
  fatherName?: string;
  motherName?: string;
  addressComplete?: string; // ENDEREÇO COMP.
  cep?: string;
  phone?: string;
  rg?: string; // IDENTIDADE
  rgIssuer?: string; // EXPEDIDOR
  rgIssueDate?: string; // DATA EXPEDIÇÃO
  cpf?: string;
  pis?: string;
  pisIssueDate?: string;
  ctps?: string;
  ctpsSeries?: string; // SÉRIE / UF
  ctpsIssueDate?: string;
  voterTitle?: string; // TÍTULO ELEITORAL
  voterZone?: string;
  voterSection?: string;
  militaryCertificate?: string; // CERTIFICADO DE RESERVISTA
  susCard?: string; // CARTÃO DO SUS
  inssBenefits?: string;
  govBenefits?: string;
  weight?: string | number; // PESO
  height?: string | number; // ALTURA
  courseRegistry?: string; // NÚMERO DO REGISTRO DO CURSO (ATA)
  
  // Anexos (Arquivos)
  photoUrl?: string; // Foto de perfil (01 foto 3x4)
  courseCertificateUrl?: string; // Certificado curso de vigilante
  addressProofUrl?: string; // Comprovante de residência
  resumeUrl?: string; // Currículo
  criminalRecordUrl?: string; // Nada Consta criminal

  // Compatibilidade Legado
  address?: string;
  neighborhood?: string;
  city?: string;
  uf?: string;
  age?: string | number;

  rank?: 'Júnior' | 'Pleno' | 'Sênior';
  status?: 'Ativo' | 'Inativo' | 'Em Intervalo' | 'Offline' | 'On Duty';
  performance?: number;
  photoUrl?: string; // Foto de perfil
  lat?: number;
  lng?: number;
  lastLocationUpdate?: string;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'email' | 'phone' | 'random';
  averageRating?: number;
  totalRatings?: number;
  onboardingComplete?: boolean;
  profileCompleted?: boolean;
  createdAt: string;
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
  createdAt: string;
}

// ---- Job Assignment ----
export type AssignmentStatus = 'pending' | 'pending_guard_approval' | 'approved' | 'rejected' | 'checked_in' | 'checked_out';
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
  createdAt: string;
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
  timestamp: string;
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
  createdAt: string;
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
  audioUrl?: string;
  createdAt: string;
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
  createdAt: string;
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
  createdAt: string;
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
  createdAt: string;
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

// ---- API Response Pattern ----
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
}
