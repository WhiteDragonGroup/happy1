import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Calendar, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './common.module.css';

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { teams, schedules, isLoggedIn, toggleFavorite, isFavorite } = useApp();

  const team = teams.find(t => String(t.id) === id);

  if (!team) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">아티스트</h1>
          <div className={styles.placeholder} />
        </header>
        <div className={styles.empty}>
          <p>아티스트를 찾을 수 없습니다</p>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            홈으로
          </button>
        </div>
      </div>
    );
  }

  const teamSchedules = schedules.filter(s =>
    !s.isDeleted && (s.team?.id === team.id || s.teamId === team.id)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleToggleFavorite = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    toggleFavorite(String(team.id));
  };

  const isFav = isFavorite(String(team.id));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">아티스트</h1>
        <button className={styles.backBtn} onClick={handleToggleFavorite}>
          <Heart
            size={24}
            fill={isFav ? 'var(--neon-pink)' : 'none'}
            color={isFav ? 'var(--neon-pink)' : 'currentColor'}
          />
        </button>
      </header>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* 프로필 섹션 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              overflow: 'hidden',
              margin: '0 auto 16px',
              border: '3px solid var(--neon-pink)',
              boxShadow: '0 0 30px var(--neon-pink-glow)'
            }}
          >
            <img
              src={team.imageUrl || 'https://picsum.photos/300/300'}
              alt={team.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </motion.div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            {team.name}
          </h2>
          {team.genre && (
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              background: 'rgba(168, 85, 247, 0.15)',
              color: 'var(--neon-purple)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              marginBottom: 12
            }}>
              {team.genre}
            </span>
          )}
          {team.description && (
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
              {team.description}
            </p>
          )}
        </div>

        {/* 일정 섹션 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Calendar size={16} style={{ marginRight: 8 }} />
            다가오는 일정
          </h3>

          {teamSchedules.length === 0 ? (
            <div className={styles.empty} style={{ padding: 40 }}>
              <Calendar size={32} className={styles.emptyIcon} />
              <p>예정된 일정이 없습니다</p>
            </div>
          ) : (
            <div className={styles.cardList}>
              {teamSchedules.map((schedule, idx) => (
                <motion.div
                  key={schedule.id}
                  className={styles.card}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => navigate(`/schedule/${schedule.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>{schedule.title}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p className={styles.cardMeta} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} />
                      {new Date(schedule.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </p>
                    {schedule.venue && (
                      <p className={styles.cardMeta} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} />
                        {schedule.venue}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
