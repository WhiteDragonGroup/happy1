import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

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
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: { email: string; password: string; name: string; phone: string }) =>
    api.post('/auth/register', data),

  me: () => api.get('/auth/me'),
};

// Team API
export const teamAPI = {
  getAll: () => api.get('/teams'),
  getById: (id: number) => api.get(`/teams/${id}`),
  search: (query: string) => api.get(`/teams/search?q=${query}`),
  create: (data: { name: string; description?: string; genre?: string }) =>
    api.post('/teams', data),
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

// Favorite API
export const favoriteAPI = {
  getAll: () => api.get('/favorites'),
  add: (teamId: number) => api.post(`/favorites/${teamId}`),
  remove: (teamId: number) => api.delete(`/favorites/${teamId}`),
  check: (teamId: number) => api.get(`/favorites/check/${teamId}`),
};

export default api;
