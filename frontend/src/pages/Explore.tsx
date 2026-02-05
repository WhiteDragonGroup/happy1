import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Filter, Heart, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './Explore.module.css';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay(); // 0=일 ~ 6=토
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((day + 6) % 7)); // 월요일 기준
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Explore() {
  const navigate = useNavigate();
  const { schedules, getFavoriteTeams, getFavoriteColor, isFavorite, isLoggedIn } = useApp();
  const [showFilter, setShowFilter] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [selectedTeamFilters, setSelectedTeamFilters] = useState<Set<number>>(new Set());
  const [selectedWeekBase, setSelectedWeekBase] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const favoriteTeams = getFavoriteTeams();
  const favoriteTeamIds = new Set(favoriteTeams.map(t => t.id));

  // 전체 일정 (삭제되지 않은 것)
  const allSchedules = useMemo(() => {
    return schedules
      .filter(s => !s.isDeleted)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [schedules]);

  const toggleTeamFilter = (teamId: number) => {
    setSelectedTeamFilters(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      // 개별 팀 필터가 모두 해제되면 filterFavorites도 off
      if (next.size === 0) setFilterFavorites(false);
      else setFilterFavorites(true);
      return next;
    });
  };

  const filteredSchedules = useMemo(() => {
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const selectedStr = fmt(selectedDate);

    let result = allSchedules.filter(s => {
      const dateStr = s.date.split('T')[0];
      return dateStr === selectedStr;
    });

    // 개별 팀 필터 적용
    if (selectedTeamFilters.size > 0 && isLoggedIn) {
      result = result.filter(s => {
        const teamId = s.team?.id || s.teamId;
        if (teamId && selectedTeamFilters.has(teamId)) return true;
        // timeSlots에 해당 팀이 포함되어 있는지도 확인
        if (s.timeSlots) {
          const slotTeamNames = s.timeSlots.map(ts => ts.teamName).filter(Boolean);
          const favTeamNames = favoriteTeams
            .filter(t => selectedTeamFilters.has(t.id))
            .map(t => t.name);
          return slotTeamNames.some(name => favTeamNames.includes(name!));
        }
        return false;
      });
    } else if (filterFavorites && isLoggedIn) {
      result = result.filter(s => {
        const teamId = s.team?.id || s.teamId;
        return teamId && favoriteTeamIds.has(teamId);
      });
    }

    return result;
  }, [allSchedules, filterFavorites, selectedTeamFilters, isLoggedIn, favoriteTeamIds, favoriteTeams, selectedDate]);


  const getTeamId = (schedule: typeof schedules[0]) => {
    return String(schedule.team?.id || schedule.teamId || '');
  };

  const today = new Date();
  const weekDates = useMemo(() => getWeekDates(selectedWeekBase), [selectedWeekBase]);

  const shiftWeek = (dir: number) => {
    setSelectedWeekBase(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  const goToday = () => {
    const now = new Date();
    setSelectedWeekBase(now);
    setSelectedDate(now);
  };

  // 현재 주에 표시할 월
  const displayMonth = weekDates[3]; // 주 중간 기준

  return (
    <div className="page">
      {/* 월 네비게이션 */}
      <header className={styles.calHeader}>
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={() => shiftWeek(-1)}>
            <ChevronLeft size={20} />
          </button>
          <span className={styles.monthLabel}>
            {displayMonth.getFullYear().toString().slice(2)}년 {displayMonth.getMonth() + 1}월
          </span>
          <button className={styles.navBtn} onClick={() => shiftWeek(1)}>
            <ChevronRight size={20} />
          </button>
          <button className={styles.todayBtn} onClick={goToday}>오늘</button>
        </div>
        <div className={styles.weekStrip}>
          {weekDates.map((d, i) => {
            const isToday = isSameDay(d, today);
            const isSelected = isSameDay(d, selectedDate);
            const dayLabel = WEEKDAYS[d.getDay()];
            return (
              <div
                key={i}
                className={styles.weekDay}
                onClick={() => setSelectedDate(new Date(d))}
              >
                <span className={styles.weekDayLabel}>{isToday ? '오늘' : dayLabel}</span>
                <span className={`${styles.weekDate} ${isSelected ? styles.weekDateSelected : ''} ${isToday && !isSelected ? styles.weekDateToday : ''}`}>
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </header>

      <div className={styles.container}>
        {/* 필터 버튼 */}
        <div className={styles.filterBar}>
          <button
            className={`${styles.filterBtn} ${filterFavorites ? styles.active : ''}`}
            onClick={() => {
              if (!isLoggedIn) {
                navigate('/login');
                return;
              }
              setFilterFavorites(!filterFavorites);
            }}
          >
            <Heart size={16} fill={filterFavorites ? 'currentColor' : 'none'} />
            찜한 팀만
          </button>

          <button
            className={styles.filterBtn}
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter size={16} />
            필터
          </button>
        </div>

        {/* 찜한 팀 필터 칩 - 항상 표시 (로그인 + 찜 있을 때) */}
        {isLoggedIn && favoriteTeams.length > 0 && (
          <div className={styles.filterTags}>
            {favoriteTeams.map(team => {
              const isActive = selectedTeamFilters.has(team.id);
              const teamColor = getFavoriteColor(String(team.id));
              return (
                <button
                  key={team.id}
                  className={`${styles.filterTag} ${isActive ? styles.filterTagActive : ''}`}
                  onClick={() => toggleTeamFilter(team.id)}
                  style={isActive && teamColor ? {
                    background: `${teamColor}22`,
                    borderColor: teamColor,
                    color: teamColor
                  } : teamColor ? {
                    borderColor: `${teamColor}66`,
                    color: `${teamColor}99`
                  } : undefined}
                >
                  {team.name}
                </button>
              );
            })}
            {selectedTeamFilters.size > 0 && (
              <button
                className={styles.clearFilter}
                onClick={() => {
                  setSelectedTeamFilters(new Set());
                  setFilterFavorites(false);
                }}
              >
                <X size={14} />
                초기화
              </button>
            )}
          </div>
        )}

        {/* 일정 그리드 */}
        <div className={styles.scheduleGrid}>
          {filteredSchedules.map((schedule, idx) => (
            <motion.div
              key={schedule.id}
              className={styles.scheduleCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/schedule/${schedule.id}`)}
            >
              <div className={styles.posterWrap}>
                <img
                  src={schedule.imageUrl || 'https://picsum.photos/400/600'}
                  alt={schedule.title}
                  className={styles.poster}
                />
                {isFavorite(getTeamId(schedule)) && (
                  <div className={styles.favBadge}>
                    <Heart size={12} fill="var(--neon-pink)" />
                  </div>
                )}
              </div>
              <div className={styles.cardContent}>
                <h4 className={styles.scheduleTitle}>{schedule.title}</h4>
                {schedule.venue && (
                  <p className={styles.venueName}>{schedule.venue}</p>
                )}
                <p className={styles.artists}>
                  {schedule.timeSlots?.map(s => s.teamName).filter(Boolean).join(', ') || schedule.team?.name || ''}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredSchedules.length === 0 && (
          <div className={styles.empty}>
            <p>표시할 일정이 없습니다</p>
            {filterFavorites && (
              <button
                className="btn btn-secondary"
                onClick={() => setFilterFavorites(false)}
              >
                필터 해제
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
