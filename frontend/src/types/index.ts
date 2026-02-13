// 사용자 역할
export type UserRole = 'USER' | 'MANAGER' | 'ADMIN';

// 사용자 정보
export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
  role: UserRole;
  createdAt: string;
}

// 팀 (공연팀)
export interface Team {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  genre?: string;
  xUrl?: string;
}

// 타임테이블 항목
export interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  teamName?: string;
  description?: string;
}

// 공연 일정
export interface Schedule {
  id: number;
  title: string;
  organizer?: string;
  team?: Team;
  teamId?: number;
  imageUrl?: string;
  date: string;
  publicDateTime?: string;  // 일정 공개일시
  ticketOpenDateTime?: string;  // 티켓 판매 오픈일시
  ticketTypes?: string;  // 티켓 권종 (콤마 구분)
  timeSlots?: TimeSlot[];
  advancePrice?: number;
  doorPrice?: number;
  priceA?: number;
  priceS?: number;
  priceR?: number;
  capacity: number;
  description?: string;
  venue?: string;
  openTime?: string;  // 입장시간
  entryNumberType?: string;  // 입장순 타입: NONE, RESERVATION_ORDER, RANDOM
  paymentCollectionType?: string;  // 결제 수단: BANK, PG
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  manager?: User;
  managerId?: number;
  isDeleted: boolean;
  isPublished: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 결제 상태
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'CANCELLED';

// 예약 상태
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'USED';

// 예약
export interface Reservation {
  id: number;
  schedule?: Schedule;
  scheduleId?: number;
  user?: User;
  userId?: number;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  timeSlot?: TimeSlot;
  timeSlotId?: number;
  paymentStatus: PaymentStatus;
  reservationStatus: ReservationStatus;
  paymentMethod: 'CARD' | 'BANK';
  amount: number;
  ticketType?: string;
  selectedTeamName?: string;
  refundBank?: string;
  refundAccount?: string;
  refundHolder?: string;
  qrCode?: string;
  isEntered: boolean;
  enteredAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// 찜
export interface Favorite {
  id: number;
  user?: User;
  userId?: number;
  team?: Team;
  teamId?: number;
  color?: string;
  createdAt: string;
}
