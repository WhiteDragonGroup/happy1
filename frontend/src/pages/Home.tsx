import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Search, Calendar, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { schedules, getFavoriteTeams, getFavoriteColor, selectedMonth, setSelectedMonth } = useApp();
  const [currentDate, setCurrentDate] = useState(selectedMonth);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFavTeamId, setSelectedFavTeamId] = useState<number | null>(null);

  const favoriteTeams = getFavoriteTeams();
  const favoriteTeamIds = new Set(favoriteTeams.map(t => t.id));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];

    // 이전 달 빈칸
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // 현재 달 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [year, month]);

  const getSchedulesForDay = (day: number) => {
    const now = new Date();
    return schedules.filter(s => {
      const scheduleDate = new Date(s.date);
      if (scheduleDate.getFullYear() !== year || scheduleDate.getMonth() !== month || scheduleDate.getDate() !== day) return false;
      if (s.isDeleted) return false;
      // 공개일시가 설정되어 있고 아직 도래하지 않았으면 숨김
      if (s.publicDateTime && new Date(s.publicDateTime) > now) return false;
      return true;
    });
  };

  const getFavoriteSchedulesForDay = (day: number) => {
    return getSchedulesForDay(day).filter(s => {
      const teamId = s.team?.id || s.teamId;
      return teamId && favoriteTeamIds.has(teamId);
    });
  };

  const prevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentDate(newDate);
    setSelectedMonth(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setCurrentDate(newDate);
    setSelectedMonth(newDate);
  };

  const goToDate = (targetYear: number, targetMonth: number) => {
    const newDate = new Date(targetYear, targetMonth - 1, 1);
    setCurrentDate(newDate);
    setSelectedMonth(newDate);
    setShowDatePicker(false);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedMonth(today);
    setShowDatePicker(false);
  };

  // 검색 결과
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const now = new Date();
    return schedules.filter(s => {
      if (s.isDeleted) return false;
      if (s.publicDateTime && new Date(s.publicDateTime) > now) return false;
      // 제목 검색
      if (s.title?.toLowerCase().includes(query)) return true;
      // 팀명 검색
      if (s.team?.name?.toLowerCase().includes(query)) return true;
      // 타임슬롯 팀명 검색
      if (s.timeSlots?.some(ts => ts.teamName?.toLowerCase().includes(query))) return true;
      return false;
    }).slice(0, 10);
  }, [searchQuery, schedules]);

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="page">
      <header className={`page-header ${styles.header}`}>
        <h1 className={styles.logo}>STAGE</h1>
        <div className={styles.headerActions}>
          <button onClick={() => setShowSearch(!showSearch)} className={styles.iconBtn}>
            <Search size={20} />
          </button>
          <button onClick={() => setShowDatePicker(!showDatePicker)} className={styles.iconBtn}>
            <Calendar size={20} />
          </button>
        </div>
      </header>

      <div className={styles.container}>
        {/* 검색바 */}
        {showSearch && (
          <motion.div
            className={styles.searchContainer}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className={styles.searchBar}>
              <Search size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="팀명, 아티스트명으로 검색"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className={styles.clearBtn}>
                  <X size={16} />
                </button>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                {searchResults.map(schedule => (
                  <div
                    key={schedule.id}
                    className={styles.searchResultItem}
                    onClick={() => {
                      navigate(`/schedule/${schedule.id}`);
                      setShowSearch(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className={styles.searchResultTitle}>{schedule.title}</div>
                    <div className={styles.searchResultMeta}>
                      {new Date(schedule.date).toLocaleDateString('ko-KR')}
                      {schedule.team?.name && ` · ${schedule.team.name}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className={styles.noResults}>검색 결과가 없습니다</div>
            )}
          </motion.div>
        )}

        {/* 날짜 워프 */}
        {showDatePicker && (
          <motion.div
            className={styles.datePicker}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.datePickerRow}>
              <select
                value={year}
                onChange={(e) => goToDate(Number(e.target.value), month + 1)}
                className={styles.dateSelect}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <select
                value={month + 1}
                onChange={(e) => goToDate(year, Number(e.target.value))}
                className={styles.dateSelect}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
              <button onClick={goToToday} className={styles.todayBtn}>오늘</button>
            </div>
          </motion.div>
        )}

        {/* 월 네비게이션 */}
        <div className={styles.monthNav}>
          <button onClick={prevMonth} className={styles.navBtn}>
            <ChevronLeft size={24} />
          </button>
          <motion.h2
            key={`${year}-${month}`}
            className={styles.monthTitle}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {year}년 {month + 1}월
          </motion.h2>
          <button onClick={nextMonth} className={styles.navBtn}>
            <ChevronRight size={24} />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className={styles.weekHeader}>
          {weekDays.map((day, idx) => (
            <div
              key={day}
              className={`${styles.weekDay} ${idx === 0 ? styles.sunday : ''} ${idx === 6 ? styles.saturday : ''}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className={styles.calendar}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${year}-${month}`}
              className={styles.calendarGrid}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {calendarData.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className={styles.emptyCell} />;
                }

                const daySchedules = getSchedulesForDay(day);
                const favoriteSchedules = getFavoriteSchedulesForDay(day);
                const isToday =
                  new Date().getFullYear() === year &&
                  new Date().getMonth() === month &&
                  new Date().getDate() === day;
                const isSunday = idx % 7 === 0;
                const isSaturday = idx % 7 === 6;

                return (
                  <motion.div
                    key={day}
                    className={`${styles.dayCell} ${isToday ? styles.today : ''} ${isSunday ? styles.sunday : ''} ${isSaturday ? styles.saturday : ''}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => daySchedules.length > 0 && navigate(`/day/${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                  >
                    <span className={styles.dayNumber}>{day}</span>

                    {daySchedules.length > 0 && (
                      <div className={styles.scheduleList}>
                        {daySchedules.slice(0, 2).map((schedule) => {
                          // 이 일정에 포함된 찜한 팀 ID들 찾기
                          const matchedTeamIds: number[] = [];
                          const directTeamId = schedule.team?.id || schedule.teamId;
                          if (directTeamId && favoriteTeamIds.has(directTeamId)) {
                            matchedTeamIds.push(directTeamId);
                          }
                          if (schedule.timeSlots) {
                            for (const slot of schedule.timeSlots) {
                              if (slot.teamName) {
                                const matchedTeam = favoriteTeams.find(t => t.name === slot.teamName);
                                if (matchedTeam && !matchedTeamIds.includes(matchedTeam.id)) {
                                  matchedTeamIds.push(matchedTeam.id);
                                }
                              }
                            }
                          }

                          // 선택된 팀이 이 일정에 있으면 그 팀 컬러, 아니면 첫번째 매칭 팀 컬러
                          let favColor: string | undefined;
                          if (selectedFavTeamId && matchedTeamIds.includes(selectedFavTeamId)) {
                            favColor = getFavoriteColor(String(selectedFavTeamId));
                          } else if (!selectedFavTeamId && matchedTeamIds.length > 0) {
                            favColor = getFavoriteColor(String(matchedTeamIds[0]));
                          }

                          // 선택된 팀이 있는데 이 일정에 없으면 흐리게
                          const isDimmed = selectedFavTeamId && !matchedTeamIds.includes(selectedFavTeamId);

                          return (
                            <div
                              key={schedule.id}
                              className={styles.scheduleItem}
                              style={{
                                ...(favColor ? {
                                  borderLeftColor: favColor,
                                  background: `linear-gradient(90deg, ${favColor}33, ${favColor}1a)`
                                } : {}),
                                ...(isDimmed ? { opacity: 0.3 } : {})
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/schedule/${schedule.id}`);
                              }}
                            >
                              <span className={styles.scheduleTitle}>
                                {schedule.title}
                              </span>
                            </div>
                          );
                        })}
                        {daySchedules.length > 2 && (
                          <span className={styles.moreCount}>+{daySchedules.length - 2}</span>
                        )}
                      </div>
                    )}

                    {favoriteSchedules.length > 0 && (() => {
                      const favTeamId = String(favoriteSchedules[0].team?.id || favoriteSchedules[0].teamId || '');
                      const indicatorColor = getFavoriteColor(favTeamId);
                      return (
                        <div className={styles.favoriteIndicator} style={indicatorColor ? { color: indicatorColor } : undefined}>
                          <Heart size={10} fill={indicatorColor || 'var(--neon-pink)'} />
                          <span>{favoriteSchedules.length}</span>
                        </div>
                      );
                    })()}
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 찜한 팀 목록 */}
        {favoriteTeams.length > 0 && (
          <div className={styles.favoriteTeams}>
            <h3 className={styles.sectionTitle}>찜한 팀</h3>
            <div className={styles.teamChips}>
              {favoriteTeams.map((team) => {
                const chipColor = getFavoriteColor(String(team.id));
                const isSelected = selectedFavTeamId === team.id;
                return (
                  <span
                    key={team.id}
                    className={`${styles.teamChip} ${isSelected ? styles.teamChipActive : ''}`}
                    style={chipColor ? {
                      borderColor: chipColor,
                      color: chipColor,
                      boxShadow: isSelected ? `0 0 12px ${chipColor}88` : `0 0 8px ${chipColor}44`,
                      background: isSelected ? `${chipColor}22` : undefined
                    } : undefined}
                    onClick={() => setSelectedFavTeamId(isSelected ? null : team.id)}
                  >
                    {team.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
