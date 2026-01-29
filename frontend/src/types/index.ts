// 사용자 역할
export type UserRole = 'guest' | 'member' | 'manager' | 'admin';

// 사용자 정보
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  profileImage?: string;
  role: UserRole;
  createdAt: string;
}

// 팀 (공연팀)
export interface Team {
  id: string;
  name: string;
  description: string;
  profileImage?: string;
  genre?: string;
}

// 타임테이블 항목
export interface TimeSlot {
  id: string;
  time: string;
  description?: string;
  remainingSeats: number;
}

// 공연 일정
export interface Schedule {
  id: string;
  title: string;
  teamId: string;
  team?: Team;
  posterImage: string;
  date: string;
  publicDate: string; // 공개일
  timeSlots: TimeSlot[];
  price?: number; // undefined면 무료
  capacity: number;
  notice?: string;
  location?: string;
  managerId: string;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// 결제 상태
export type PaymentStatus = 'pending' | 'card_completed' | 'bank_pending' | 'bank_completed' | 'refunded' | 'cancelled';

// 예약 상태
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'used';

// 예약
export interface Reservation {
  id: string;
  scheduleId: string;
  schedule?: Schedule;
  userId: string;
  user?: User;
  timeSlotId: string;
  timeSlot?: TimeSlot;
  paymentStatus: PaymentStatus;
  reservationStatus: ReservationStatus;
  paymentMethod: 'card' | 'bank';
  amount: number;
  qrCode: string;
  isEntered: boolean;
  createdAt: string;
  updatedAt: string;
}

// 찜
export interface Favorite {
  id: string;
  userId: string;
  teamId: string;
  team?: Team;
  createdAt: string;
}

// 정산 요청
export interface Settlement {
  id: string;
  managerId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  processedAt?: string;
}

// 문의
export interface Inquiry {
  id: string;
  userId: string;
  title: string;
  content: string;
  reply?: string;
  status: 'pending' | 'replied';
  createdAt: string;
  repliedAt?: string;
}

// 일정 등록 폼
export interface ScheduleFormData {
  title: string;
  teamId: string;
  posterImage: File | null;
  date: string;
  publicDate: string;
  timeSlots: { time: string; description?: string }[];
  price?: number;
  capacity: number;
  notice?: string;
  location?: string;
  // 스위치 상태
  showPrice: boolean;
  showNotice: boolean;
  showLocation: boolean;
}