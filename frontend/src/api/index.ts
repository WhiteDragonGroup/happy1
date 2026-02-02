import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),

  register: (data: { email: string; password: string; name: string; phone: string }) =>
    api.post('/auth/register', data),

  me: () => api.get('/auth/me'),

  kakaoLogin: (accessToken: string) =>
    api.post('/auth/kakao', { accessToken }),

  kakaoCallback: (code: string) =>
    api.post('/auth/kakao/callback', { code }),
};

// Team API
export const teamAPI = {
  getAll: () => api.get('/teams'),
  getById: (id: number) => api.get(`/teams/${id}`),
  search: (query: string) => api.get(`/teams/search?q=${query}`),
  create: (data: { name: string; description?: string; genre?: string }) =>
    api.post('/teams', data),
  update: (id: number, data: { name: string; description?: string; genre?: string }) =>
    api.put(`/teams/${id}`, data),
  delete: (id: number) => api.delete(`/teams/${id}`),
};

// Schedule API
export const scheduleAPI = {
  getAll: () => api.get('/schedules'),
  getById: (id: number) => api.get(`/schedules/${id}`),
  getByDate: (date: string) => api.get(`/schedules/date/${date}`),
  getByMonth: (year: number, month: number) =>
    api.get(`/schedules/month?year=${year}&month=${month}`),
  getMy: () => api.get('/schedules/my'),
  create: (data: any) => api.post('/schedules', data),
  update: (id: number, data: any) => api.put(`/schedules/${id}`, data),
  delete: (id: number) => api.delete(`/schedules/${id}`),
};

// Reservation API
export const reservationAPI = {
  getAll: () => api.get('/reservations'),
  getBySchedule: (scheduleId: number) => api.get(`/reservations/schedule/${scheduleId}`),
  create: (data: { scheduleId: number; timeSlotId: number; paymentMethod: string }) =>
    api.post('/reservations', data),
  confirmPayment: (id: number) => api.post(`/reservations/${id}/confirm-payment`),
  enter: (id: number) => api.post(`/reservations/${id}/enter`),
  enterByQr: (qrCode: string) => api.post(`/reservations/qr/${qrCode}`),
};

// User API
export const userAPI = {
  getAll: () => api.get('/users'),
  updateRole: (id: number, role: string) => api.patch(`/users/${id}/role`, { role }),
  getMe: () => api.get('/users/me'),
  updateMe: (data: { name?: string; phone?: string; email?: string }) =>
    api.patch('/users/me', data),
};

// Inquiry API
export const inquiryAPI = {
  getAll: () => api.get('/inquiries'),
  getAllAdmin: () => api.get('/inquiries/all'),
  create: (data: { title: string; content: string }) => api.post('/inquiries', data),
  answer: (id: number, answer: string) => api.post(`/inquiries/${id}/answer`, { answer }),
};

// Manager Request API
export const managerRequestAPI = {
  getAll: () => api.get('/manager-requests'),
  getAllAdmin: () => api.get('/manager-requests/all'),
  getPending: () => api.get('/manager-requests/pending'),
  create: (data: { teamName: string; description: string; snsLink?: string; reason: string }) =>
    api.post('/manager-requests', data),
  approve: (id: number) => api.post(`/manager-requests/${id}/approve`),
  reject: (id: number, reason: string) => api.post(`/manager-requests/${id}/reject`, { reason }),
};

// Favorite API
export const favoriteAPI = {
  getAll: () => api.get('/favorites'),
  add: (teamId: number) => api.post(`/favorites/${teamId}`),
  remove: (teamId: number) => api.delete(`/favorites/${teamId}`),
  check: (teamId: number) => api.get(`/favorites/check/${teamId}`),
};

export default api;
