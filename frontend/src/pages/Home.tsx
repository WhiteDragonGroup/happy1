import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { schedules, getFavoriteTeams, selectedMonth, setSelectedMonth } = useApp();
  const [currentDate, setCurrentDate] = useState(selectedMonth);

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
    return schedules.filter(s => {
      const scheduleDate = new Date(s.date);
      return (
        scheduleDate.getFullYear() === year &&
        scheduleDate.getMonth() === month &&
        scheduleDate.getDate() === day &&
        !s.isDeleted &&
        new Date(s.publicDate) <= new Date()
      );
    });
  };

  const getFavoriteSchedulesForDay = (day: number) => {
    return getSchedulesForDay(day).filter(s => favoriteTeamIds.has(s.teamId));
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

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">STAGE</h1>
      </header>

      <div className={styles.container}>
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
                        {daySchedules.slice(0, 2).map((schedule) => (
                          <div
                            key={schedule.id}
                            className={styles.scheduleItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/schedule/${schedule.id}`);
                            }}
                          >
                            <span className={styles.scheduleTitle}>
                              {schedule.title.length > 6 ? schedule.title.slice(0, 6) + '..' : schedule.title}
                            </span>
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <span className={styles.moreCount}>+{daySchedules.length - 2}</span>
                        )}
                      </div>
                    )}

                    {favoriteSchedules.length > 0 && (
                      <div className={styles.favoriteIndicator}>
                        <Heart size={10} fill="var(--neon-pink)" />
                        <span>{favoriteSchedules.length}</span>
                      </div>
                    )}
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
              {favoriteTeams.map((team) => (
                <span key={team.id} className={styles.teamChip}>
                  {team.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}