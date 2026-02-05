import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Heart,
  Share2,
  Ticket,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { reservationAPI } from '../api';
import ArtistPopup from '../components/ArtistPopup';
import styles from './ScheduleDetail.module.css';
import type { Reservation } from '../types';

type ReserveStep = 'slot' | 'confirm' | 'complete';

export default function ScheduleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    isLoggedIn,
    user,
    schedules,
    teams,
    reservations,
    toggleFavorite,
    isFavorite,
    refreshData
  } = useApp();
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // 예약 모달 state
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveStep, setReserveStep] = useState<ReserveStep>('slot');
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [reserving, setReserving] = useState(false);
  const [completedReservation, setCompletedReservation] = useState<Reservation | null>(null);

  const schedule = schedules.find(s => String(s.id) === id);

  // 파생 데이터
  const existingReservation = schedule
    ? reservations.find(r => r.scheduleId === schedule.id && r.reservationStatus !== 'CANCELLED')
    : null;
  const isManagerOrAdmin = user && schedule
    ? (schedule.managerId === user.id || user.role === 'ADMIN')
    : false;

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

  const openReserveModal = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setReserveStep(schedule.timeSlots && schedule.timeSlots.length > 0 ? 'slot' : 'confirm');
    setSelectedSlotId(null);
    setCompletedReservation(null);
    setShowReserveModal(true);
  };

  const handleReserve = async () => {
    setReserving(true);
    try {
      const res = await reservationAPI.create({
        scheduleId: schedule.id,
        timeSlotId: selectedSlotId || 0,
        paymentMethod: 'BANK',
      });
      setCompletedReservation(res.data);
      setReserveStep('complete');
      await refreshData();
    } catch (err: any) {
      alert(err.response?.data || '예약 신청에 실패했습니다.');
    } finally {
      setReserving(false);
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
            {schedule.openTime && (
              <div className={styles.metaItem}>
                <Clock size={18} />
                <span>입장 {schedule.openTime.slice(0, 5)}</span>
              </div>
            )}
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
                      <span
                        className={styles.slotTeam}
                        onClick={() => setSelectedArtist(slot.teamName || null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {slot.teamName}
                      </span>
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

      {/* 하단 고정 바 */}
      {isLoggedIn && (
        <div className={styles.bottomBar}>
          {isManagerOrAdmin ? (
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => navigate(`/manage-reservations/${schedule.id}`)}
            >
              <Users size={18} />
              예약자 관리
            </button>
          ) : existingReservation ? (
            <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
              <CheckCircle2 size={18} />
              예약완료
            </button>
          ) : (
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={openReserveModal}
            >
              <Ticket size={18} />
              예약 신청
            </button>
          )}
        </div>
      )}

      {/* 예약 모달 */}
      {showReserveModal && (
        <div className={styles.modalOverlay} onClick={() => !reserving && setShowReserveModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            {/* Step 1: 타임슬롯 선택 */}
            {reserveStep === 'slot' && (
              <>
                <h3 className={styles.modalTitle}>타임슬롯 선택</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {schedule.timeSlots?.map(slot => (
                    <div
                      key={slot.id}
                      className={`${styles.timeSlot} ${selectedSlotId === slot.id ? styles.selected : ''}`}
                      onClick={() => setSelectedSlotId(slot.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Clock size={16} />
                      <span className={styles.slotTime}>
                        {slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}
                      </span>
                      {slot.teamName && <span className={styles.slotTeam}>{slot.teamName}</span>}
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={!selectedSlotId}
                  onClick={() => setReserveStep('confirm')}
                >
                  다음
                </button>
                <button className={styles.modalClose} onClick={() => setShowReserveModal(false)}>
                  취소
                </button>
              </>
            )}

            {/* Step 2: 예약 신청 확인 */}
            {reserveStep === 'confirm' && (
              <>
                <h3 className={styles.modalTitle}>예약 신청</h3>
                <div className={styles.modalInfo}>
                  <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {schedule.title}
                  </p>
                  {selectedSlotId && schedule.timeSlots && (
                    <p className={styles.modalTime}>
                      {schedule.timeSlots.find(s => s.id === selectedSlotId)?.startTime?.slice(0, 5)} - {schedule.timeSlots.find(s => s.id === selectedSlotId)?.endTime?.slice(0, 5)}
                      {schedule.timeSlots.find(s => s.id === selectedSlotId)?.teamName && ` / ${schedule.timeSlots.find(s => s.id === selectedSlotId)?.teamName}`}
                    </p>
                  )}
                  {schedule.advancePrice ? (
                    <p className={styles.modalPrice}>
                      {Number(schedule.advancePrice).toLocaleString()}원
                    </p>
                  ) : (
                    <p className={styles.modalPrice}>무료</p>
                  )}
                </div>
                {schedule.advancePrice && Number(schedule.advancePrice) > 0 && (
                  <p style={{
                    color: 'var(--neon-orange)',
                    fontSize: '0.8125rem',
                    textAlign: 'center',
                    padding: '10px 12px',
                    background: 'var(--neon-orange-glow)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '16px'
                  }}>
                    예약 신청 후 입금이 확인되면 예약이 확정됩니다
                  </p>
                )}
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleReserve}
                  disabled={reserving}
                >
                  {reserving ? '신청 중...' : '예약 신청하기'}
                </button>
                <button
                  className={styles.modalClose}
                  onClick={() => {
                    if (schedule.timeSlots && schedule.timeSlots.length > 0) {
                      setReserveStep('slot');
                    } else {
                      setShowReserveModal(false);
                    }
                  }}
                  disabled={reserving}
                >
                  {schedule.timeSlots && schedule.timeSlots.length > 0 ? '뒤로' : '취소'}
                </button>
              </>
            )}

            {/* Step 3: 신청 완료 */}
            {reserveStep === 'complete' && completedReservation && (
              <>
                <h3 className={styles.modalTitle}>
                  <CheckCircle2 size={24} color="var(--neon-green)" />
                  {' '}예약 신청 완료
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', textAlign: 'center' }}>
                    예약 신청이 접수되었습니다
                  </p>
                  <p style={{
                    color: 'var(--neon-orange)',
                    fontSize: '0.8125rem',
                    textAlign: 'center',
                    padding: '10px 12px',
                    background: 'var(--neon-orange-glow)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    공연 등록자가 입금 확인 후 예약이 확정되며,<br />
                    확정 후 QR코드가 발급됩니다
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '20px' }}
                  onClick={() => setShowReserveModal(false)}
                >
                  확인
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 아티스트 팝업 */}
      {selectedArtist && (
        <ArtistPopup
          artist={teams.find(t => t.name.toLowerCase() === selectedArtist.toLowerCase()) || null}
          artistName={selectedArtist}
          onClose={() => setSelectedArtist(null)}
        />
      )}
    </div>
  );
}
