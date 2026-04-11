// ============================================================
// Alpha360 Dashboard — API Client (HTTP)
// Centraliza TODAS as chamadas à API backend
// Substitui o acesso direto ao Firestore
// ============================================================

import { auth } from '@/firebase';
import type {
  ApiResponse,
  Job,
  UserData,
  JobAssignment,
  Alert,
  Site,
  PixPayment,
  QRCodeData,
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Cliente HTTP centralizado para a API Alpha360
 * Automaticamente inclui o token JWT do Firebase Auth
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado.');
    return user.getIdToken();
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const token = await this.getToken();

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.error || `Erro HTTP ${res.status}`);
    }

    return json.data;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, data?: any): Promise<T> {
    return this.request<T>('POST', path, data);
  }

  async put<T>(path: string, data?: any): Promise<T> {
    return this.request<T>('PUT', path, data);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  // ==============================================================
  // AUTH
  // ==============================================================
  async getMe(): Promise<UserData> {
    return this.get<UserData>('/api/auth/me');
  }

  // ==============================================================
  // JOBS (ESCALAS)
  // ==============================================================
  async listJobs(statusFilter?: string[]): Promise<Job[]> {
    const params = statusFilter ? `?status=${statusFilter.join(',')}` : '';
    const res = await this.get<any>(`/api/jobs${params}`);
    return res; // listResponse retorna array em data
  }

  async getJob(id: string): Promise<Job> {
    return this.get<Job>(`/api/jobs/${id}`);
  }

  async createJob(data: Partial<Job>): Promise<{ id: string }> {
    return this.post<{ id: string }>('/api/jobs', data);
  }

  async updateJob(id: string, data: Partial<Job>): Promise<{ id: string }> {
    return this.put<{ id: string }>(`/api/jobs/${id}`, data);
  }

  async deleteJob(id: string): Promise<{ id: string }> {
    return this.delete<{ id: string }>(`/api/jobs/${id}`);
  }

  // ==============================================================
  // USERS
  // ==============================================================
  async listUsers(): Promise<UserData[]> {
    return this.get<any>('/api/users');
  }

  async getUser(id: string): Promise<UserData> {
    return this.get<UserData>(`/api/users/${id}`);
  }

  async updateUser(id: string, data: Partial<UserData>): Promise<{ id: string }> {
    return this.put<{ id: string }>(`/api/users/${id}`, data);
  }

  // ==============================================================
  // GUARDS
  // ==============================================================
  async listGuards(): Promise<UserData[]> {
    return this.get<any>('/api/guards');
  }

  async getGuard(id: string): Promise<UserData> {
    return this.get<UserData>(`/api/guards/${id}`);
  }

  async searchGuard(name: string, cpf: string): Promise<UserData> {
    return this.get<UserData>(`/api/guards/search?name=${encodeURIComponent(name)}&cpf=${encodeURIComponent(cpf)}`);
  }

  async suggestGuards(jobId: string): Promise<UserData[]> {
    return this.post<any>('/api/guards/suggest', { jobId });
  }

  async rateGuard(data: { guardId: string; jobId: string; assignmentId: string; rating: number; comment?: string }): Promise<any> {
    return this.post('/api/guards/rate', data);
  }

  // ==============================================================
  // ASSIGNMENTS
  // ==============================================================
  async listAssignments(filters?: {
    jobId?: string;
    guardId?: string;
    status?: string[];
  }): Promise<JobAssignment[]> {
    const params = new URLSearchParams();
    if (filters?.jobId) params.set('jobId', filters.jobId);
    if (filters?.guardId) params.set('guardId', filters.guardId);
    if (filters?.status) params.set('status', filters.status.join(','));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.get<any>(`/api/assignments${qs}`);
  }

  async createAssignment(data: Partial<JobAssignment>): Promise<{ id: string }> {
    return this.post<{ id: string }>('/api/assignments', data);
  }

  async updateAssignment(id: string, data: Partial<JobAssignment>): Promise<{ id: string }> {
    return this.put<{ id: string }>(`/api/assignments/${id}`, data);
  }

  async approveAssignment(id: string, assignmentRole: string = 'Segurança'): Promise<any> {
    return this.post(`/api/assignments/${id}/approve`, { assignmentRole });
  }

  async rejectAssignment(id: string): Promise<any> {
    return this.post(`/api/assignments/${id}/reject`);
  }

  async requestJob(jobId: string): Promise<{ id: string }> {
    return this.post<{ id: string }>('/api/assignments/request', { jobId });
  }

  async inviteGuard(data: { jobId: string; guardId: string; guardName: string; guardPhoto?: string }): Promise<{ id: string }> {
    return this.post<{ id: string }>('/api/assignments/invite', data);
  }

  async getGuardAssignments(guardId?: string, status?: string[]): Promise<any[]> {
    const params = new URLSearchParams();
    if (guardId) params.set('guardId', guardId);
    if (status) params.set('status', status.join(','));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.get<any>(`/api/assignments/guard${qs}`);
  }

  // ==============================================================
  // CHECK-IN / CHECK-OUT
  // ==============================================================
  async checkin(data: {
    qrData?: QRCodeData;
    lat?: number;
    lng?: number;
    manual?: boolean;
    assignmentId?: string;
    jobId?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.post('/api/checkin', data);
  }

  async checkout(data: {
    qrData?: QRCodeData;
    lat?: number;
    lng?: number;
    manual?: boolean;
    assignmentId?: string;
    jobId?: string;
    checkinAt?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.post('/api/checkout', data);
  }

  // ==============================================================
  // ALERTS
  // ==============================================================
  async listAlerts(filters?: {
    guardId?: string;
    contractorId?: string;
    limit?: number;
  }): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (filters?.guardId) params.set('guardId', filters.guardId);
    if (filters?.contractorId) params.set('contractorId', filters.contractorId);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.get<any>(`/api/alerts${qs}`);
  }

  async createAlert(data: Partial<Alert>): Promise<{ id: string }> {
    return this.post<{ id: string }>('/api/alerts', data);
  }

  async updateAlert(id: string, data: Partial<Alert>): Promise<{ id: string }> {
    return this.put<{ id: string }>(`/api/alerts/${id}`, data);
  }

  async deleteAlert(id: string): Promise<{ id: string }> {
    return this.delete<{ id: string }>(`/api/alerts/${id}`);
  }

  // ==============================================================
  // SITES (POSTOS)
  // ==============================================================
  async listSites(): Promise<Site[]> {
    return this.get<any>('/api/sites');
  }

  async getSite(id: string): Promise<Site> {
    return this.get<Site>(`/api/sites/${id}`);
  }

  async createSite(data: Partial<Site>): Promise<{ id: string }> {
    return this.post<{ id: string }>('/api/sites', data);
  }

  async updateSite(id: string, data: Partial<Site>): Promise<{ id: string }> {
    return this.put<{ id: string }>(`/api/sites/${id}`, data);
  }

  async deleteSite(id: string): Promise<{ id: string }> {
    return this.delete<{ id: string }>(`/api/sites/${id}`);
  }

  // ==============================================================
  // PAYMENTS
  // ==============================================================
  async listPayments(guardId?: string): Promise<PixPayment[]> {
    const params = guardId ? `?guardId=${guardId}` : '';
    return this.get<any>(`/api/payments${params}`);
  }

  async createPayment(data: Partial<PixPayment>): Promise<{ id: string }> {
    return this.post<{ id: string }>('/api/payments', data);
  }

  async processPayment(id: string): Promise<any> {
    return this.post(`/api/payments/${id}/process`);
  }

  // ==============================================================
  // MANUAL CHECKIN / CHECKOUT
  // ==============================================================
  async manualCheckin(data: {
    guardId: string;
    assignmentId: string;
    jobId: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.post('/api/checkin/manual', data);
  }

  async manualCheckout(data: {
    guardId: string;
    assignmentId: string;
    jobId: string;
    checkinAt: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.post('/api/checkout/manual', data);
  }

  // ==============================================================
  // GUARD ASSIGNMENTS WITH JOBS  
  // ==============================================================
  async getGuardAssignmentsWithJobs(guardId: string, statuses: string[]): Promise<any[]> {
    const params = new URLSearchParams();
    params.set('guardId', guardId);
    params.set('status', statuses.join(','));
    params.set('withJobs', 'true');
    return this.get<any>(`/api/assignments/guard?${params.toString()}`);
  }

  // ==============================================================
  // MESSAGES / CHAT
  // ==============================================================
  async sendMessage(data: { jobId: string; senderId: string; senderName: string; text: string }): Promise<{ id: string }> {
    return this.post<{ id: string }>('/api/messages', data);
  }

  // ==============================================================
  // USER MANAGEMENT
  // ==============================================================
  async createUser(data: Partial<UserData>): Promise<{ id: string }> {
    return this.post<{ id: string }>('/api/users', data);
  }

  async deleteUser(id: string): Promise<{ id: string }> {
    return this.delete<{ id: string }>(`/api/users/${id}`);
  }
}

// Singleton
export const api = new ApiClient(API_BASE_URL);
