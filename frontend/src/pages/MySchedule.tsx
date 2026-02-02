import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Ticket, Clock, MapPin, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './MySchedule.module.css';

type TabType = 'reserved' | 'wishlist';

export default function MySchedule() {
  const navigate = useNavigate();
  const { user, isLoggedIn, reservations, getFavoriteTeams, schedules } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('reserved');

  const favoriteTeams = getFavoriteTeams();
  const favoriteTeamIds = new Set(favoriteTeams.map(t => t.id));

  // 내 예약 목록
  const myReservations = useMemo(() => {
    if (!user) return [];
    return reservations.filter(r => r.userId === user.id && r.reservationStatus !== 'CANCELLED');
  }, [reservations, user]);

  // 찜한 팀의 일정 (아직 예약 안한 것)
  const wishlistSchedules = useMemo(() => {
    if (!isLoggedIn || favoriteTeamIds.size === 0) return [];
    const reservedScheduleIds = new Set(myReservations.map(r => r.scheduleId));

    return schedules.filter(s => {
      const teamId = s.team?.id || s.teamId;
      return (
        teamId && favoriteTeamIds.has(teamId) &&
        !s.isDeleted &&
        !reservedScheduleIds.has(s.id) &&
        new Date(s.date) >= new Date()
      );
    });
  }, [schedules, favoriteTeamIds, myReservations, isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="page">
        <header className="page-header">
          <h1 className="page-title">나의 일정</h1>
        </header>
        <div className={styles.loginPrompt}>
          <Calendar size={48} className={styles.promptIcon} />
          <h2>로그인이 필요합니다</h2>
          <p>나의 일정을 확인하려면 로그인해주세요</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            로그인
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="badge badge-green">예약확정</span>;
      case 'PENDING':
        return <span className="badge badge-orange">예약대기</span>;
      case 'USED':
        return <span className="badge badge-blue">사용완료</span>;
      default:
        return <span className="badge">알수없음</span>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className={styles.paymentBadge}>결제완료</span>;
      case 'PENDING':
        return <span className={`${styles.paymentBadge} ${styles.pending}`}>입금대기</span>;
      case 'REFUNDED':
        return <span className={styles.paymentBadge}>환불됨</span>;
      default:
        return null;
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">나의 일정</h1>
      </header>

      <div className={styles.container}>
        {/* 탭 */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'reserved' ? 'active' : ''}`}
            onClick={() => setActiveTab('reserved')}
          >
            <Ticket size={16} />
            예약완료 ({myReservations.length})
          </button>
          <button
            className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('wishlist')}
          >
            <Heart size={16} />
            예약예정 ({wishlistSchedules.length})
          </button>
        </div>

        {/* 예약 목록 */}
        {activeTab === 'reserved' && (
          <div className={styles.scheduleGrid}>
            {myReservations.length > 0 ? (
              myReservations.map((reservation, idx) => (
                <motion.div
                  key={reservation.id}
                  className={styles.scheduleCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/schedule/${reservation.scheduleId}`)}
                >
                  <div className={styles.posterWrap}>
                    <img
                      src={reservation.schedule?.imageUrl || 'https://picsum.photos/400/600'}
                      alt={reservation.schedule?.title}
                      className={styles.poster}
                    />
                    <div className={styles.statusBadge}>
                      {getStatusBadge(reservation.reservationStatus)}
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.scheduleTitle}>
                      {reservation.schedule?.title}
                    </h3>
                    <p className={styles.teamName}>
                      {reservation.schedule?.team?.name}
                    </p>
                    <div className={styles.metaRow}>
                      <Calendar size={14} />
                      <span>
                        {new Date(reservation.schedule?.date || '').toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </span>
                    </div>
                    <div className={styles.metaRow}>
                      <Clock size={14} />
                      <span>{reservation.timeSlot?.startTime?.slice(0, 5)}</span>
                    </div>
                    <div className={styles.cardFooter}>
                      {getPaymentBadge(reservation.paymentStatus)}
                      <span className={styles.amount}>
                        {reservation.amount.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className={styles.empty}>
                <Ticket size={48} className={styles.emptyIcon} />
                <p>예약한 일정이 없습니다</p>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/explore')}
                >
                  공연 탐색하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 찜한 팀 일정 */}
        {activeTab === 'wishlist' && (
          <div className={styles.scheduleGrid}>
            {wishlistSchedules.length > 0 ? (
              wishlistSchedules.map((schedule, idx) => (
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
                    <div className={styles.favIndicator}>
                      <Heart size={14} fill="var(--neon-pink)" />
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.scheduleTitle}>{schedule.title}</h3>
                    <p className={styles.teamName}>{schedule.team?.name}</p>
                    <div className={styles.metaRow}>
                      <Calendar size={14} />
                      <span>
                        {new Date(schedule.date).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </span>
                    </div>
                    {schedule.venue && (
                      <div className={styles.metaRow}>
                        <MapPin size={14} />
                        <span>{schedule.venue}</span>
                      </div>
                    )}
                    <div className={styles.cardFooter}>
                      <span className={styles.price}>
                        {(!schedule.advancePrice && !schedule.doorPrice) ? '무료' : (schedule.advancePrice ? `${Number(schedule.advancePrice).toLocaleString()}원` : `${Number(schedule.doorPrice).toLocaleString()}원`)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className={styles.empty}>
                <Heart size={48} className={styles.emptyIcon} />
                <p>찜한 팀의 예정된 일정이 없습니다</p>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/favorites')}
                >
                  팀 찜하러 가기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}