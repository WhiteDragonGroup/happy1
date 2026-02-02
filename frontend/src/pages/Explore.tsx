import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Heart, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './Explore.module.css';

export default function Explore() {
  const navigate = useNavigate();
  const { schedules, getFavoriteTeams, isFavorite, isLoggedIn } = useApp();
  const [showFilter, setShowFilter] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);

  const favoriteTeams = getFavoriteTeams();
  const favoriteTeamIds = new Set(favoriteTeams.map(t => t.id));

  // 전체 일정 (삭제되지 않은 것)
  const allSchedules = useMemo(() => {
    return schedules
      .filter(s => !s.isDeleted)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    if (!filterFavorites || !isLoggedIn) return allSchedules;
    return allSchedules.filter(s => {
      const teamId = s.team?.id || s.teamId;
      return teamId && favoriteTeamIds.has(teamId);
    });
  }, [allSchedules, filterFavorites, isLoggedIn, favoriteTeamIds]);

  // 날짜별로 그룹화
  const groupedSchedules = useMemo(() => {
    const groups: { [date: string]: typeof filteredSchedules } = {};
    filteredSchedules.forEach(schedule => {
      const dateKey = new Date(schedule.date).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(schedule);
    });
    return groups;
  }, [filteredSchedules]);

  const getTeamId = (schedule: typeof schedules[0]) => {
    return String(schedule.team?.id || schedule.teamId || '');
  };

  return (
    <div className="page">
      <header className={`page-header ${styles.header}`}>
        <h1 className={styles.pageTitle}>SCHEDULE</h1>
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

        {/* 찜한 팀 필터 표시 */}
        {filterFavorites && favoriteTeams.length > 0 && (
          <motion.div
            className={styles.filterTags}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {favoriteTeams.map(team => (
              <span key={team.id} className={styles.filterTag}>
                {team.name}
              </span>
            ))}
            <button
              className={styles.clearFilter}
              onClick={() => setFilterFavorites(false)}
            >
              <X size={14} />
              초기화
            </button>
          </motion.div>
        )}

        {/* 일정 그리드 */}
        {Object.entries(groupedSchedules).map(([date, scheduleList]) => (
          <div key={date} className={styles.dateGroup}>
            <h3 className={styles.dateTitle}>{date}</h3>
            <div className={styles.scheduleGrid}>
              {scheduleList.map((schedule, idx) => (
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
                    <p className={styles.teamName}>{schedule.team?.name}</p>
                    <span className={styles.time}>
                      {schedule.timeSlots?.[0]?.startTime?.slice(0, 5) || ''}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

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
