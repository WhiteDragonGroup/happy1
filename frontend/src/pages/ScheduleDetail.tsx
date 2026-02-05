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
  CreditCard,
  Building2,
  CheckCircle2,
  Users
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import { reservationAPI } from '../api';
import ArtistPopup from '../components/ArtistPopup';
import styles from './ScheduleDetail.module.css';
import type { Reservation } from '../types';

type ReserveStep = 'slot' | 'payment' | 'complete';

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
  const [, setSelectedPayment] = useState<'CARD' | 'BANK' | null>(null);
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
    setReserveStep(schedule.timeSlots && schedule.timeSlots.length > 0 ? 'slot' : 'payment');
    setSelectedSlotId(null);
    setSelectedPayment(null);
    setCompletedReservation(null);
    setShowReserveModal(true);
  };

  const handleReserve = async (paymentMethod: 'CARD' | 'BANK') => {
    setSelectedPayment(paymentMethod);
    setReserving(true);
    try {
      const res = await reservationAPI.create({
        scheduleId: schedule.id,
        timeSlotId: selectedSlotId || 0,
        paymentMethod,
      });
      setCompletedReservation(res.data);
      setReserveStep('complete');
      await refreshData();
    } catch (err: any) {
      alert(err.response?.data || '예약에 실패했습니다.');
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
              예약하기
            </button>
          )}
        </div>
      )}

      {/* 3단계 예약 모달 */}
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
                  onClick={() => setReserveStep('payment')}
                >
                  다음
                </button>
                <button className={styles.modalClose} onClick={() => setShowReserveModal(false)}>
                  취소
                </button>
              </>
            )}

            {/* Step 2: 결제 방법 선택 */}
            {reserveStep === 'payment' && (
              <>
                <h3 className={styles.modalTitle}>결제 방법 선택</h3>
                <div className={styles.modalInfo}>
                  <p>{schedule.title}</p>
                  {selectedSlotId && schedule.timeSlots && (
                    <p className={styles.modalTime}>
                      {schedule.timeSlots.find(s => s.id === selectedSlotId)?.startTime?.slice(0, 5)} - {schedule.timeSlots.find(s => s.id === selectedSlotId)?.endTime?.slice(0, 5)}
                    </p>
                  )}
                  <p className={styles.modalPrice}>
                    {schedule.advancePrice ? `${Number(schedule.advancePrice).toLocaleString()}원` : '무료'}
                  </p>
                </div>
                <div className={styles.paymentOptions}>
                  <button
                    className={styles.paymentOption}
                    onClick={() => handleReserve('CARD')}
                    disabled={reserving}
                  >
                    <CreditCard size={20} />
                    <span>카드 결제</span>
                    <span className={styles.paymentDesc}>즉시 확정</span>
                  </button>
                  <button
                    className={styles.paymentOption}
                    onClick={() => handleReserve('BANK')}
                    disabled={reserving}
                  >
                    <Building2 size={20} />
                    <span>계좌이체</span>
                    <span className={styles.paymentDesc}>입금 확인 후 확정</span>
                  </button>
                </div>
                {reserving && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    예약 처리 중...
                  </p>
                )}
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
                  뒤로
                </button>
              </>
            )}

            {/* Step 3: 완료 + QR코드 */}
            {reserveStep === 'complete' && completedReservation && (
              <>
                <h3 className={styles.modalTitle}>
                  <CheckCircle2 size={24} color="var(--neon-green)" />
                  {' '}예약 완료
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    padding: '16px',
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    display: 'inline-flex'
                  }}>
                    <QRCodeSVG value={completedReservation.qrCode || ''} size={180} />
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
                    입장 시 이 QR코드를 보여주세요
                  </p>
                  {completedReservation.paymentMethod === 'BANK' && (
                    <p style={{
                      color: 'var(--neon-orange)',
                      fontSize: '0.8125rem',
                      textAlign: 'center',
                      padding: '8px 12px',
                      background: 'var(--neon-orange-glow)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      계좌이체 선택 - 입금 확인 후 예약이 확정됩니다
                    </p>
                  )}
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
