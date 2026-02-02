import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Team, Schedule, Reservation, Favorite } from '../types';
import { authAPI, teamAPI, scheduleAPI, reservationAPI, favoriteAPI } from '../api';

interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  teams: Team[];
  schedules: Schedule[];
  reservations: Reservation[];
  favorites: Favorite[];
  selectedMonth: Date;
  loading: boolean;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  kakaoLogin: () => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string, phone: string) => Promise<boolean>;
  toggleFavorite: (teamId: string) => void;
  isFavorite: (teamId: string) => boolean;
  getFavoriteTeams: () => Team[];
  setSelectedMonth: (date: Date) => void;
  getSchedulesByDate: (date: Date) => Schedule[];
  getSchedulesByTeam: (teamId: string) => Schedule[];
  makeReservation: (scheduleId: string, timeSlotId: string, paymentMethod: 'card' | 'bank') => Promise<boolean>;
  cancelReservation: (reservationId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  setAuthResponse: (token: string, user: User) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const isLoggedIn = user !== null;

  // 초기 데이터 로드
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authAPI.me();
          setUser(res.data);
          await loadUserData();
        } catch {
          localStorage.removeItem('token');
        }
      }
      await loadPublicData();
      setLoading(false);
    };
    init();
  }, []);

  const loadPublicData = async () => {
    try {
      const [teamsRes, schedulesRes] = await Promise.all([
        teamAPI.getAll(),
        scheduleAPI.getAll(),
      ]);
      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
      setSchedules(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);
    } catch (error) {
      console.error('Failed to load public data:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const [reservationsRes, favoritesRes] = await Promise.all([
        reservationAPI.getAll(),
        favoriteAPI.getAll(),
      ]);
      setReservations(reservationsRes.data);
      setFavorites(favoritesRes.data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const refreshData = async () => {
    await loadPublicData();
    if (isLoggedIn) {
      await loadUserData();
    }
  };

  const setAuthResponse = async (token: string, user: User) => {
    localStorage.setItem('token', token);
    setUser(user);
    await loadUserData();
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      await loadUserData();
      return true;
    } catch {
      return false;
    }
  };

  const kakaoLogin = async (): Promise<boolean> => {
    const Kakao = (window as any).Kakao;

    if (!Kakao) {
      console.error('Kakao SDK가 로드되지 않았습니다.');
      return false;
    }

    if (!Kakao.isInitialized()) {
      Kakao.init('fa35ab7422c93c4782ad86452321dd2c');
    }

    return new Promise(() => {
      Kakao.Auth.authorize({
        redirectUri: window.location.origin + '/oauth/kakao/callback',
        state: 'kakao_login',
      });
      // 리다이렉트되므로 여기서는 resolve하지 않음
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setReservations([]);
    setFavorites([]);
  };

  const register = async (email: string, password: string, name: string, phone: string): Promise<boolean> => {
    try {
      const res = await authAPI.register({ email, password, name, phone });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return true;
    } catch {
      return false;
    }
  };

  const toggleFavorite = async (teamId: string) => {
    if (!user) return;

    const existing = favorites.find(f => String(f.team?.id) === teamId || String(f.teamId) === teamId);
    try {
      if (existing) {
        await favoriteAPI.remove(Number(teamId));
        setFavorites(favorites.filter(f => f.id !== existing.id));
      } else {
        const res = await favoriteAPI.add(Number(teamId));
        setFavorites([...favorites, res.data]);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const isFavorite = (teamId: string): boolean => {
    return favorites.some(f => String(f.team?.id) === teamId || String(f.teamId) === teamId);
  };

  const getFavoriteTeams = (): Team[] => {
    return favorites
      .map(f => f.team || teams.find(t => String(t.id) === String(f.teamId)))
      .filter((t): t is Team => t !== undefined);
  };

  const getSchedulesByDate = (date: Date): Schedule[] => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(s => {
      const scheduleDate = typeof s.date === 'string' ? s.date.split('T')[0] : s.date;
      return scheduleDate === dateStr && !s.isDeleted;
    });
  };

  const getSchedulesByTeam = (teamId: string): Schedule[] => {
    return schedules.filter(s => {
      const scheduleTeamId = s.team?.id || s.teamId;
      return String(scheduleTeamId) === teamId && !s.isDeleted;
    });
  };

  const makeReservation = async (
    scheduleId: string,
    timeSlotId: string,
    paymentMethod: 'card' | 'bank'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const res = await reservationAPI.create({
        scheduleId: Number(scheduleId),
        timeSlotId: Number(timeSlotId),
        paymentMethod,
      });
      setReservations([...reservations, res.data]);
      return true;
    } catch {
      return false;
    }
  };

  const cancelReservation = async (reservationId: string): Promise<boolean> => {
    // TODO: 구현
    console.log('Cancel reservation:', reservationId);
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoggedIn,
        teams,
        schedules,
        reservations,
        favorites,
        selectedMonth,
        loading,
        login,
        kakaoLogin,
        logout,
        register,
        toggleFavorite,
        isFavorite,
        getFavoriteTeams,
        setSelectedMonth,
        getSchedulesByDate,
        getSchedulesByTeam,
        makeReservation,
        cancelReservation,
        refreshData,
        setAuthResponse,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
