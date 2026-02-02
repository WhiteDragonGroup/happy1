import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Clock, Heart, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './common.module.css';

export default function DaySchedules() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { schedules, isFavorite, getFavoriteTeams } = useApp();
  const favoriteTeams = getFavoriteTeams();
  const favoriteTeamNames = new Set(favoriteTeams.map(t => t.name.toLowerCase()));

  if (!date) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">일정</h1>
          <div className={styles.placeholder} />
        </header>
        <div className={styles.empty}>
          <p>날짜를 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const daySchedules = schedules.filter(s => {
    const scheduleDate = s.date.split('T')[0];
    return scheduleDate === date && !s.isDeleted;
  });

  const getTeamId = (schedule: typeof schedules[0]) => {
    return String(schedule.team?.id || schedule.teamId || '');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">일정</h1>
        <div className={styles.placeholder} />
      </header>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* 날짜 헤더 */}
        <div style={{
          textAlign: 'center',
          marginBottom: 24,
          padding: '20px 0',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <Calendar size={32} color="var(--neon-cyan)" style={{ marginBottom: 8 }} />
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            {formattedDate}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {daySchedules.length}개의 일정
          </p>
        </div>

        {daySchedules.length === 0 ? (
          <div className={styles.empty}>
            <Calendar size={48} className={styles.emptyIcon} />
            <p>이 날의 일정이 없습니다</p>
            <button className="btn btn-secondary" onClick={() => navigate('/explore')}>
              전체 일정 보기
            </button>
          </div>
        ) : (
          <div className={styles.cardList}>
            {daySchedules.map((schedule, idx) => (
              <motion.div
                key={schedule.id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(`/schedule/${schedule.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', gap: 16 }}>
                  {/* 포스터 썸네일 */}
                  <div style={{
                    width: 80,
                    height: 100,
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    position: 'relative'
                  }}>
                    <img
                      src={schedule.imageUrl || 'https://picsum.photos/200/250'}
                      alt={schedule.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {isFavorite(getTeamId(schedule)) && (
                      <div style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: '50%',
                        padding: 4
                      }}>
                        <Heart size={12} fill="var(--neon-pink)" color="var(--neon-pink)" />
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      color: 'var(--neon-cyan)',
                      marginBottom: 4
                    }}>
                      {schedule.team?.name}
                    </span>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {schedule.title}
                    </h3>

                    {schedule.timeSlots && schedule.timeSlots.length > 0 && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Clock size={14} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {schedule.timeSlots[0].startTime?.slice(0, 5)}
                            {schedule.timeSlots.length > 1 && ` ~ ${schedule.timeSlots[schedule.timeSlots.length - 1].endTime?.slice(0, 5)}`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                          <Users size={14} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {schedule.timeSlots.map((slot, i) => {
                              const isFav = slot.teamName && favoriteTeamNames.has(slot.teamName.toLowerCase());
                              return slot.teamName ? (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: isFav ? 'rgba(255, 26, 92, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                                    color: isFav ? 'var(--neon-pink)' : 'var(--text-secondary)',
                                    border: isFav ? '1px solid var(--neon-pink)' : '1px solid transparent',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  {isFav && <Heart size={10} fill="var(--neon-pink)" />}
                                  {slot.teamName}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {schedule.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} color="var(--text-muted)" />
                        <span style={{
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {schedule.venue}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
