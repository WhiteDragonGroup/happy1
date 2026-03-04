import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Ticket, Clock, MapPin, Heart, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import { reservationAPI } from '../api';
import styles from './MySchedule.module.css';
import type { Reservation } from '../types';

type TabType = 'reserved' | 'wishlist';

export default function MySchedule() {
  const navigate = useNavigate();
  const { user, isLoggedIn, reservations, getFavoriteTeams, schedules, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('reserved');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelConfirmText, setCancelConfirmText] = useState('');

  const favoriteTeams = getFavoriteTeams();
  const favoriteTeamIds = new Set(favoriteTeams.map(t => t.id));

  // 내 예약 목록
  const myReservations = useMemo(() => {
    if (!user) return [];
    return reservations.filter(r => r.userId === user.id && r.reservationStatus !== 'CANCELLED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      case 'CANCEL_REQUESTED':
        return <span className="badge badge-red" style={{ background: 'rgba(255,26,92,0.15)', color: 'var(--neon-pink)' }}>취소요청</span>;
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
                  onClick={() => setSelectedReservation(reservation)}
                >
                  <div className={styles.posterWrap}>
                    <img
                      src={reservation.schedule?.imageUrl && !reservation.schedule.imageUrl.startsWith('blob:') ? reservation.schedule.imageUrl : ''}
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
                    {reservation.schedule?.organizer && (
                      <p className={styles.teamName}>
                        {reservation.schedule.organizer}
                      </p>
                    )}
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
                    {(reservation.timeSlot?.startTime || reservation.schedule?.openTime) && (
                      <div className={styles.metaRow}>
                        <Clock size={14} />
                        <span>
                          {reservation.timeSlot?.startTime
                            ? reservation.timeSlot.startTime.slice(0, 5)
                            : reservation.schedule?.openTime?.slice(0, 5)}
                        </span>
                      </div>
                    )}
                    <div className={styles.cardFooter}>
                      {getPaymentBadge(reservation.paymentStatus)}
                      <span className={styles.amount}>
                        {reservation.amount > 0 ? `${reservation.amount.toLocaleString()}원` : '무료'}
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
                      src={schedule.imageUrl && !schedule.imageUrl.startsWith('blob:') ? schedule.imageUrl : ''}
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
                        {(schedule.priceA || schedule.priceS || schedule.priceR)
                          ? [schedule.priceA && `A ${Number(schedule.priceA).toLocaleString()}원`, schedule.priceS && `S ${Number(schedule.priceS).toLocaleString()}원`, schedule.priceR && `R ${Number(schedule.priceR).toLocaleString()}원`].filter(Boolean).join(' / ')
                          : '무료'}
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

      {/* QR코드 모달 */}
      {selectedReservation && (
        <div className={styles.modalOverlay} onClick={() => setSelectedReservation(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className={styles.modalTitle} style={{ marginBottom: 0 }}>
                {selectedReservation.reservationStatus === 'CONFIRMED' || selectedReservation.reservationStatus === 'USED'
                  ? '예약 QR코드'
                  : '예약 정보'}
              </h3>
              <button onClick={() => setSelectedReservation(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* 확정된 예약만 QR코드 + 입장번호 표시 */}
            {(selectedReservation.reservationStatus === 'CONFIRMED' || selectedReservation.reservationStatus === 'USED') ? (
              <div className={styles.qrSection}>
                {selectedReservation.entryNumber != null && (
                  <div style={{
                    padding: '8px 16px', textAlign: 'center',
                    background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan)',
                    borderRadius: 'var(--radius-md)', marginBottom: '12px', width: '100%'
                  }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginBottom: '2px' }}>입장번호</p>
                    <p style={{ color: 'var(--neon-cyan)', fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                      {selectedReservation.entryNumber}
                    </p>
                  </div>
                )}
                <div style={{
                  padding: '16px',
                  background: 'white',
                  borderRadius: 'var(--radius-lg)',
                  display: 'inline-flex'
                }}>
                  <QRCodeSVG value={selectedReservation.qrCode || ''} size={180} />
                </div>
                <p className={styles.qrHint}>입장 시 이 QR코드를 보여주세요</p>
              </div>
            ) : selectedReservation.reservationStatus === 'CANCEL_REQUESTED' ? (
              <div className={styles.qrSection}>
                <p style={{
                  color: 'var(--neon-pink)',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  padding: '20px 16px',
                  background: 'rgba(255,26,92,0.1)',
                  borderRadius: 'var(--radius-lg)',
                  width: '100%'
                }}>
                  취소 요청이 접수되었습니다<br />관리자 확인 후 처리됩니다
                </p>
              </div>
            ) : (
              <div className={styles.qrSection}>
                <p style={{
                  color: 'var(--neon-orange)',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  padding: '20px 16px',
                  background: 'var(--neon-orange-glow)',
                  borderRadius: 'var(--radius-lg)',
                  width: '100%'
                }}>
                  입금 확인 후 예약이 확정되면<br />QR코드가 발급됩니다
                </p>
              </div>
            )}

            <div className={styles.reservationDetail}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {selectedReservation.schedule?.title}
              </p>
              {selectedReservation.schedule?.organizer && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {selectedReservation.schedule.organizer}
                </p>
              )}
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {new Date(selectedReservation.schedule?.date || '').toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
                })}
              </p>
              {(selectedReservation.timeSlot?.startTime || selectedReservation.schedule?.openTime) && (
                <p style={{ fontSize: '0.875rem', color: 'var(--neon-blue)' }}>
                  {selectedReservation.timeSlot?.startTime
                    ? `${selectedReservation.timeSlot.startTime.slice(0, 5)}${selectedReservation.timeSlot.endTime ? ` - ${selectedReservation.timeSlot.endTime.slice(0, 5)}` : ''}`
                    : `입장 ${selectedReservation.schedule?.openTime?.slice(0, 5)}`}
                  {selectedReservation.timeSlot?.teamName && ` / ${selectedReservation.timeSlot.teamName}`}
                </p>
              )}
              {selectedReservation.createdAt && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  예약일시: {new Date(selectedReservation.createdAt).toLocaleString('ko-KR', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                {getStatusBadge(selectedReservation.reservationStatus)}
                {getPaymentBadge(selectedReservation.paymentStatus)}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  setSelectedReservation(null);
                  navigate(`/schedule/${selectedReservation.scheduleId}`);
                }}
              >
                일정 상세보기
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setSelectedReservation(null)}
              >
                닫기
              </button>
            </div>
            {selectedReservation.reservationStatus !== 'CANCELLED' && selectedReservation.reservationStatus !== 'CANCEL_REQUESTED' && selectedReservation.reservationStatus !== 'USED' && (
              <button
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setShowCancelModal(true);
                  setCancelConfirmText('');
                }}
              >
                예약취소 신청
              </button>
            )}
          </div>
        </div>
      )}

      {/* 취소 확인 모달 */}
      {showCancelModal && selectedReservation && (
        <div className={styles.modalOverlay} onClick={() => setShowCancelModal(false)} style={{ zIndex: 1100 }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '320px' }}>
            <h3 className={styles.modalTitle} style={{ color: 'var(--neon-pink)', marginBottom: '12px' }}>
              예약 취소 신청
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '8px' }}>
              <strong>{selectedReservation.schedule?.title}</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '20px' }}>
              해당 공연을 정말 취소하시겠습니까?
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginBottom: '8px' }}>
              확인을 위해 아래에 <strong style={{ color: 'var(--neon-pink)' }}>예약취소</strong>를 입력해주세요
            </p>
            <input
              type="text"
              value={cancelConfirmText}
              onChange={e => setCancelConfirmText(e.target.value)}
              placeholder="예약취소"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                textAlign: 'center',
                marginBottom: '16px'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowCancelModal(false)}
              >
                돌아가기
              </button>
              <button
                className="btn btn-primary"
                style={{
                  flex: 1,
                  background: cancelConfirmText === '예약취소' ? 'var(--neon-pink)' : 'var(--text-muted)',
                  opacity: cancelConfirmText === '예약취소' ? 1 : 0.5
                }}
                disabled={cancelConfirmText !== '예약취소' || cancelling}
                onClick={async () => {
                  setCancelling(true);
                  try {
                    await reservationAPI.cancelRequest(selectedReservation.id);
                    await refreshData();
                    setShowCancelModal(false);
                    setSelectedReservation(null);
                  } catch (err: any) {
                    const msg = err.response?.data;
                    alert(typeof msg === 'string' ? msg : '취소 요청에 실패했습니다.');
                  }
                  setCancelling(false);
                }}
              >
                {cancelling ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
