import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Heart,
  Share2,
  User,
  Ticket
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './ScheduleDetail.module.css';

export default function ScheduleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    isLoggedIn,
    schedules,
    toggleFavorite,
    isFavorite
  } = useApp();

  const schedule = schedules.find(s => String(s.id) === id);

  if (!schedule) {
    return (
      <div className="page">
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">일정</h1>
          <div className={styles.headerRight} />
        </header>
        <div className={styles.notFound}>
          <p>일정을 찾을 수 없습니다</p>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            홈으로
          </button>
        </div>
      </div>
    );
  }

  const handleToggleFavorite = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const teamId = schedule.team?.id || schedule.teamId;
    if (teamId) toggleFavorite(String(teamId));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: schedule.title,
          text: `${schedule.team?.name} - ${schedule.title}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="page">
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">일정</h1>
        <div className={styles.headerRight}>
          <button className={styles.iconBtn} onClick={handleToggleFavorite}>
            <Heart
              size={22}
              fill={isFavorite(String(schedule.team?.id || schedule.teamId || '')) ? 'var(--neon-pink)' : 'none'}
              color={isFavorite(String(schedule.team?.id || schedule.teamId || '')) ? 'var(--neon-pink)' : 'currentColor'}
            />
          </button>
          <button className={styles.iconBtn} onClick={handleShare}>
            <Share2 size={22} />
          </button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={styles.container}
      >
        {/* 포스터 */}
        <div className={styles.posterSection}>
          <img
            src={schedule.imageUrl || 'https://picsum.photos/400/600'}
            alt={schedule.title}
            className={styles.poster}
          />
        </div>

        {/* 정보 */}
        <div className={styles.infoSection}>
          {schedule.organizer && (
            <div className={styles.teamBadge}>{schedule.organizer}</div>
          )}
          <h2 className={styles.title}>{schedule.title}</h2>

          <div className={styles.metaList}>
            <div className={styles.metaItem}>
              <Calendar size={18} />
              <span>
                {new Date(schedule.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </span>
            </div>
            {schedule.venue && (
              <div className={styles.metaItem}>
                <MapPin size={18} />
                <span>{schedule.venue}</span>
              </div>
            )}
          </div>

          {/* 가격 정보 */}
          {(schedule.advancePrice || schedule.doorPrice) && (
            <div className={styles.priceSection}>
              <h3 className={styles.sectionLabel}>입장료</h3>
              <div className={styles.priceList}>
                {schedule.advancePrice && (
                  <div className={styles.priceItem}>
                    <Ticket size={16} />
                    <span>예약 발권</span>
                    <span className={styles.priceValue}>{Number(schedule.advancePrice).toLocaleString()}원</span>
                  </div>
                )}
                {schedule.doorPrice && (
                  <div className={styles.priceItem}>
                    <Ticket size={16} />
                    <span>현장 발권</span>
                    <span className={styles.priceValue}>{Number(schedule.doorPrice).toLocaleString()}원</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 타임테이블 */}
          {schedule.timeSlots && schedule.timeSlots.length > 0 && (
            <div className={styles.timeSlotsSection}>
              <h3 className={styles.sectionLabel}>타임테이블</h3>
              <div className={styles.timeSlots}>
                {schedule.timeSlots.map((slot, idx) => (
                  <div key={slot.id || idx} className={styles.timeSlot}>
                    <Clock size={16} />
                    <span className={styles.slotTime}>
                      {slot.startTime?.slice(0, 5)}
                      {slot.endTime && ` - ${slot.endTime.slice(0, 5)}`}
                    </span>
                    {slot.teamName && (
                      <span className={styles.slotTeam}>{slot.teamName}</span>
                    )}
                    {slot.description && (
                      <span className={styles.slotDesc}>{slot.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 안내사항 */}
          {schedule.description && (
            <div className={styles.noticeSection}>
              <h3 className={styles.sectionLabel}>안내사항</h3>
              <pre className={styles.notice}>{schedule.description}</pre>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
