import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  Share2,
  CreditCard,
  Building,
  QrCode,
  Check,
  X,
  Camera
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './ScheduleDetail.module.css';

type TabType = 'info' | 'reservations';

export default function ScheduleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    user,
    isLoggedIn,
    schedules,
    reservations,
    toggleFavorite,
    isFavorite,
    makeReservation
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQrCamera, setShowQrCamera] = useState(false);

  const schedule = schedules.find(s => String(s.id) === id);

  const isOwner = schedule?.managerId === user?.id || user?.role === 'ADMIN';

  // 이 일정의 예약자 목록 (관리자용)
  const scheduleReservations = useMemo(() => {
    if (!schedule) return [];
    return reservations.filter(r => r.scheduleId === schedule.id);
  }, [reservations, schedule]);

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

  const handleReservation = async (paymentMethod: 'card' | 'bank') => {
    if (!selectedTimeSlot) return;

    const success = await makeReservation(String(schedule.id), selectedTimeSlot, paymentMethod);
    if (success) {
      setShowPaymentModal(false);
      navigate('/my-schedule');
    }
  };

  const handleToggleFavorite = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const teamId = schedule.team?.id || schedule.teamId;
    if (teamId) toggleFavorite(String(teamId));
  };

  const handleEntry = (reservationId: number, enter: boolean) => {
    console.log(`${enter ? '입장 처리' : '입장 취소'}: ${reservationId}`);
  };

  const handleBankConfirm = (reservationId: number) => {
    console.log(`입금 확인: ${reservationId}`);
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '결제완료';
      case 'PENDING': return '입금대기';
      case 'REFUNDED': return '환불됨';
      case 'CANCELLED': return '취소됨';
      default: return status;
    }
  };

  const getReservationStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return '예약확정';
      case 'PENDING': return '예약대기';
      case 'CANCELLED': return '예약취소';
      case 'USED': return '사용완료';
      default: return status;
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
          <button className={styles.iconBtn}>
            <Share2 size={22} />
          </button>
        </div>
      </header>

      {/* 관리자 탭 */}
      {isOwner && (
        <div className={styles.managerTabs}>
          <button
            className={`${styles.managerTab} ${activeTab === 'info' ? styles.active : ''}`}
            onClick={() => setActiveTab('info')}
          >
            일정
          </button>
          <button
            className={`${styles.managerTab} ${activeTab === 'reservations' ? styles.active : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            예약자목록 ({scheduleReservations.length})
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'info' ? (
          <motion.div
            key="info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.container}
          >
            {/* 포스터 */}
            <div className={styles.posterSection}>
              <img
                src={schedule.imageUrl || 'https://picsum.photos/400/600'}
                alt={schedule.title}
                className={styles.poster}
              />
              {(schedule.price === undefined || schedule.price === null || Number(schedule.price) === 0) && (
                <div className={styles.freeBadge}>무료</div>
              )}
            </div>

            {/* 정보 */}
            <div className={styles.infoSection}>
              <div className={styles.teamBadge}>{schedule.team?.name}</div>
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
                <div className={styles.metaItem}>
                  <Users size={18} />
                  <span>정원 {schedule.capacity}명</span>
                </div>
              </div>

              {/* 타임테이블 */}
              {schedule.timeSlots && schedule.timeSlots.length > 0 && (
                <div className={styles.timeSlotsSection}>
                  <h3 className={styles.sectionLabel}>공연 시간</h3>
                  <div className={styles.timeSlots}>
                    {schedule.timeSlots.map((slot) => {
                      const remainingSeats = slot.capacity - (slot.reservedCount || 0);
                      return (
                        <button
                          key={slot.id}
                          className={`${styles.timeSlot} ${String(selectedTimeSlot) === String(slot.id) ? styles.selected : ''} ${remainingSeats === 0 ? styles.soldOut : ''}`}
                          onClick={() => remainingSeats > 0 && setSelectedTimeSlot(String(slot.id))}
                          disabled={remainingSeats === 0}
                        >
                          <Clock size={16} />
                          <span className={styles.slotTime}>{slot.startTime?.slice(0, 5)}</span>
                          <span className={styles.slotSeats}>
                            {remainingSeats > 0
                              ? `잔여 ${remainingSeats}석`
                              : '매진'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 가격 */}
              <div className={styles.priceSection}>
                <span className={styles.priceLabel}>가격</span>
                <span className={styles.price}>
                  {(schedule.price === undefined || schedule.price === null || Number(schedule.price) === 0) ? '무료' : `${Number(schedule.price).toLocaleString()}원`}
                </span>
              </div>

              {/* 안내사항 */}
              {schedule.description && (
                <div className={styles.noticeSection}>
                  <h3 className={styles.sectionLabel}>안내사항</h3>
                  <pre className={styles.notice}>{schedule.description}</pre>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reservations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.container}
          >
            {/* QR 카메라 컨트롤 */}
            <div className={styles.qrControl}>
              <button
                className={`btn ${showQrCamera ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShowQrCamera(!showQrCamera)}
              >
                <Camera size={18} />
                QR 카메라 {showQrCamera ? 'OFF' : 'ON'}
              </button>
            </div>

            {/* QR 카메라 영역 */}
            {showQrCamera && (
              <div className={styles.qrCameraSection}>
                <div className={styles.qrCamera}>
                  <QrCode size={48} />
                  <p>QR 코드를 스캔하세요</p>
                </div>
              </div>
            )}

            {/* 예약자 목록 */}
            <div className={styles.reservationList}>
              {scheduleReservations.length > 0 ? (
                scheduleReservations.map((reservation) => (
                  <div key={reservation.id} className={styles.reservationCard}>
                    <div className={styles.reservationInfo}>
                      <div className={styles.reservationName}>
                        {reservation.user?.name || '익명'}
                        <span className={styles.reservationTime}>
                          {reservation.timeSlot?.startTime?.slice(0, 5)}
                        </span>
                      </div>
                      <div className={styles.reservationMeta}>
                        <span className={`${styles.statusBadge} ${styles[reservation.paymentStatus]}`}>
                          {getPaymentStatusText(reservation.paymentStatus)}
                        </span>
                        <span className={`${styles.statusBadge} ${styles[reservation.reservationStatus]}`}>
                          {getReservationStatusText(reservation.reservationStatus)}
                        </span>
                        {reservation.isEntered && (
                          <span className={`${styles.statusBadge} ${styles.entered}`}>
                            입장완료
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.reservationActions}>
                      {reservation.paymentStatus === 'PENDING' && reservation.paymentMethod === 'BANK' && (
                        <button
                          className={`btn btn-sm ${styles.confirmBtn}`}
                          onClick={() => handleBankConfirm(reservation.id)}
                        >
                          입금확인
                        </button>
                      )}
                      {!reservation.isEntered ? (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEntry(reservation.id, true)}
                        >
                          <Check size={14} />
                          입장확인
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEntry(reservation.id, false)}
                        >
                          <X size={14} />
                          입장취소
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyReservations}>
                  <p>아직 예약자가 없습니다</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 예약 버튼 (정보 탭일 때만) */}
      {activeTab === 'info' && !isOwner && (
        <div className={styles.bottomBar}>
          <button
            className="btn btn-primary btn-full btn-lg"
            disabled={!selectedTimeSlot}
            onClick={() => {
              if (!isLoggedIn) {
                navigate('/login');
                return;
              }
              setShowPaymentModal(true);
            }}
          >
            {selectedTimeSlot ? '예약하기' : '시간을 선택해주세요'}
          </button>
        </div>
      )}

      {/* 결제 모달 */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>결제 방법 선택</h3>

              <div className={styles.modalInfo}>
                <p>{schedule.title}</p>
                <p className={styles.modalTime}>
                  {schedule.timeSlots?.find(t => String(t.id) === selectedTimeSlot)?.startTime?.slice(0, 5)}
                </p>
                <p className={styles.modalPrice}>
                  {(schedule.price === undefined || schedule.price === null || Number(schedule.price) === 0) ? '무료' : `${Number(schedule.price).toLocaleString()}원`}
                </p>
              </div>

              <div className={styles.paymentOptions}>
                <button
                  className={styles.paymentOption}
                  onClick={() => handleReservation('card')}
                >
                  <CreditCard size={24} />
                  <span>카드 결제</span>
                  <span className={styles.paymentDesc}>즉시 결제 완료</span>
                </button>
                <button
                  className={styles.paymentOption}
                  onClick={() => handleReservation('bank')}
                >
                  <Building size={24} />
                  <span>계좌 이체</span>
                  <span className={styles.paymentDesc}>입금 확인 후 예약 확정</span>
                </button>
              </div>

              <button
                className={styles.modalClose}
                onClick={() => setShowPaymentModal(false)}
              >
                취소
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}