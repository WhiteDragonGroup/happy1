import type { Team, Schedule, Reservation, User } from '../types';

export const mockTeams: Team[] = [
  {
    id: 1,
    name: '버스커버스커',
    description: '감성적인 어쿠스틱 사운드로 사랑받는 밴드',
    imageUrl: 'https://picsum.photos/seed/team1/200/200',
    genre: '어쿠스틱',
  },
  {
    id: 2,
    name: '혁오',
    description: '독특한 음색과 감각적인 음악으로 주목받는 밴드',
    imageUrl: 'https://picsum.photos/seed/team2/200/200',
    genre: '인디록',
  },
  {
    id: 3,
    name: '잔나비',
    description: '복고풍 사운드와 감성적인 가사의 밴드',
    imageUrl: 'https://picsum.photos/seed/team3/200/200',
    genre: '레트로팝',
  },
  {
    id: 4,
    name: '새소년',
    description: '에너지 넘치는 라이브 퍼포먼스의 밴드',
    imageUrl: 'https://picsum.photos/seed/team4/200/200',
    genre: '록',
  },
  {
    id: 5,
    name: '실리카겔',
    description: '실험적인 일렉트로닉 사운드의 밴드',
    imageUrl: 'https://picsum.photos/seed/team5/200/200',
    genre: '일렉트로닉',
  },
  {
    id: 6,
    name: '검정치마',
    description: '몽환적인 사운드스케이프의 밴드',
    imageUrl: 'https://picsum.photos/seed/team6/200/200',
    genre: '드림팝',
  },
  {
    id: 7,
    name: '브로콜리너마저',
    description: '유쾌하고 따뜻한 감성의 밴드',
    imageUrl: 'https://picsum.photos/seed/team7/200/200',
    genre: '포크팝',
  },
  {
    id: 8,
    name: '넬',
    description: '깊은 감성과 웅장한 사운드의 밴드',
    imageUrl: 'https://picsum.photos/seed/team8/200/200',
    genre: '얼터너티브',
  },
];

// 1월 일정 생성
const generateSchedules = (): Schedule[] => {
  const schedules: Schedule[] = [];
  const year = 2025;
  const month = 0; // January

  // 여러 날짜에 공연 배치
  const scheduleData = [
    { day: 3, teamIdx: 0, title: '버스커버스커 신년 콘서트' },
    { day: 5, teamIdx: 1, title: '혁오 단독 공연' },
    { day: 5, teamIdx: 2, title: '잔나비 라이브' },
    { day: 8, teamIdx: 3, title: '새소년 록 페스티벌' },
    { day: 10, teamIdx: 4, title: '실리카겔 일렉트로닉 나이트' },
    { day: 12, teamIdx: 5, title: '검정치마 드림팝 콘서트' },
    { day: 12, teamIdx: 6, title: '브로콜리너마저 어쿠스틱 라이브' },
    { day: 15, teamIdx: 7, title: '넬 20주년 기념 공연' },
    { day: 17, teamIdx: 0, title: '버스커버스커 앵콜 공연' },
    { day: 18, teamIdx: 1, title: '혁오 & 잔나비 콜라보' },
    { day: 20, teamIdx: 2, title: '잔나비 미드나잇 콘서트' },
    { day: 22, teamIdx: 3, title: '새소년 인디록 페스타' },
    { day: 24, teamIdx: 4, title: '실리카겔 전자음악 축제' },
    { day: 25, teamIdx: 5, title: '검정치마 윈터 콘서트' },
    { day: 26, teamIdx: 6, title: '브로콜리너마저 신곡 발표회' },
    { day: 28, teamIdx: 7, title: '넬 발라드 콘서트' },
    { day: 30, teamIdx: 0, title: '버스커버스커 마지막 공연' },
    { day: 31, teamIdx: 1, title: '혁오 설날 스페셜' },
  ];

  scheduleData.forEach((data, idx) => {
    const team = mockTeams[data.teamIdx];
    const date = new Date(year, month, data.day);
    const publicDate = new Date(year, month, data.day - 7); // 일주일 전 공개

    const remainingSeats1 = Math.floor(Math.random() * 50) + 10;
    const remainingSeats2 = Math.floor(Math.random() * 50) + 10;

    schedules.push({
      id: idx + 1,
      title: data.title,
      teamId: team.id,
      team,
      imageUrl: `https://picsum.photos/seed/poster${idx + 1}/400/600`,
      date: date.toISOString(),
      publicDate: publicDate.toISOString(),
      timeSlots: [
        { id: idx * 2 + 1, startTime: '18:00', endTime: '19:30', capacity: 100, reservedCount: 100 - remainingSeats1 },
        { id: idx * 2 + 2, startTime: '20:00', endTime: '21:30', capacity: 100, reservedCount: 100 - remainingSeats2 },
      ],
      price: [0, 15000, 25000, 35000, 45000][Math.floor(Math.random() * 5)],
      capacity: 100,
      description: '공연 시작 30분 전까지 입장해 주세요.\n음식물 반입은 금지됩니다.\n공연 중 사진 촬영은 자유롭게 가능합니다.',
      venue: ['홍대 클럽 FF', '이태원 블루스', '합정 롤링홀', '강남 뮤직홀'][Math.floor(Math.random() * 4)],
      managerId: 1,
      isDeleted: false,
      isPublished: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return schedules;
};

export const mockSchedules: Schedule[] = generateSchedules();

// 예약 데이터
const mockUser: User = {
  id: 1,
  email: 'user@test.com',
  name: '김회원',
  phone: '010-1234-5678',
  role: 'USER',
  createdAt: '2024-01-01',
};

export const mockReservations: Reservation[] = [
  {
    id: 1,
    scheduleId: 1,
    schedule: mockSchedules[0],
    userId: 1,
    user: mockUser,
    timeSlotId: 1,
    timeSlot: mockSchedules[0].timeSlots?.[0],
    paymentStatus: 'COMPLETED',
    reservationStatus: 'CONFIRMED',
    paymentMethod: 'CARD',
    amount: 25000,
    qrCode: 'QR-123456',
    isEntered: false,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 2,
    scheduleId: 5,
    schedule: mockSchedules[4],
    userId: 1,
    user: mockUser,
    timeSlotId: 9,
    timeSlot: mockSchedules[4].timeSlots?.[1],
    paymentStatus: 'PENDING',
    reservationStatus: 'PENDING',
    paymentMethod: 'BANK',
    amount: 35000,
    qrCode: 'QR-789012',
    isEntered: false,
    createdAt: '2025-01-02T14:00:00Z',
    updatedAt: '2025-01-02T14:00:00Z',
  },
];
