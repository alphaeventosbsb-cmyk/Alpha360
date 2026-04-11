import { auth } from '@/lib/firebase';

let API_BASE = import.meta.env.VITE_API_URL || '';

if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  if (API_BASE.includes('localhost')) {
    API_BASE = API_BASE.replace('localhost', window.location.hostname);
  }
}

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Não autenticado');
  return user.getIdToken();
}

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || `Erro ${res.status}`);
  return json.data;
}

export const api = {
  // Auth
  getMe: () => request<any>('GET', '/api/auth/me'),

  // Jobs
  listJobs: (status?: string[]) => {
    const params = status ? `?status=${status.join(',')}` : '';
    return request<any[]>('GET', `/api/jobs${params}`);
  },
  getJob: (id: string) => request<any>('GET', `/api/jobs/${id}`),
  requestJob: (jobId: string) => request<any>('POST', '/api/assignments/request', { jobId }),

  // Assignments
  listAssignments: (filters?: any) => {
    const params = new URLSearchParams();
    if (filters?.guardId) params.set('guardId', filters.guardId);
    if (filters?.status) params.set('status', filters.status.join(','));
    return request<any[]>('GET', `/api/assignments?${params.toString()}`);
  },
  getGuardAssignments: async (guardId: string) => {
    const data = await request<any[]>('GET', `/api/assignments/guard?guardId=${guardId}`);
    return data.map((item: any) => ({
      ...(item.assignment || item),
      jobName: item.job?.clientName || item.job?.title || item.clientName,
      clientName: item.job?.clientName || item.clientName,
    }));
  },

  // Check-in / Check-out
  checkin: (data: any) => request<any>('POST', '/api/checkin', data),
  checkout: (data: any) => request<any>('POST', '/api/checkout', data),

  // Alerts
  createAlert: (data: any) => request<any>('POST', '/api/alerts', data),
  listAlerts: (filters?: any) => {
    const params = new URLSearchParams();
    if (filters?.guardId) params.set('guardId', filters.guardId);
    return request<any[]>('GET', `/api/alerts?${params.toString()}`);
  },

  // User
  getUser: (id: string) => request<any>('GET', `/api/users/${id}`),
  updateUser: (id: string, data: any) => request<any>('PUT', `/api/users/${id}`, data),
  resetUserProfile: (id: string) => request<any>('POST', `/api/users/${id}/reset-profile`),

  // Guards
  listGuards: () => request<any[]>('GET', '/api/guards'),

  // Messages
  sendMessage: (data: any) => request<any>('POST', '/api/messages', data),
  listMessages: (jobId: string) => request<any[]>('GET', `/api/messages?jobId=${jobId}`),
};
