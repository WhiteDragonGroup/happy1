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

type ReserveStep = 'team' | 'account' | 'confirm' | 'complete';

const BANK_LIST = [
  '카카오뱅크', '국민은행', '신한은행', '하나은행', '우리은행',
  '농협은행', '기업은행', 'SC제일은행', '대구은행', '부산은행',
  '토스뱅크', '케이뱅크', '경남은행', '광주은행', '수협은행',
  '새마을금고', '신협', '우체국'
];

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
  const [reserveStep, setReserveStep] = useState<ReserveStep>('team');
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [reserving, setReserving] = useState(false);
  const [completedReservation, setCompletedReservation] = useState<Reservation | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
  const [refundBank, setRefundBank] = useState('');
  const [refundAccount, setRefundAccount] = useState('');
  const [refundHolder, setRefundHolder] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

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

  // 팀 이름 목록 추출 (중복 제거)
  const teamNames = schedule.timeSlots
    ? [...new Set(schedule.timeSlots.map(s => s.teamName).filter(Boolean) as string[])]
    : [];

  const hasTicketPrice = !!(schedule.priceA || schedule.priceS || schedule.priceR);
  const isFreeSchedule = !hasTicketPrice;

  const openReserveModal = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setSelectedSlotId(null);
    setCompletedReservation(null);
    setSelectedTeamName(null);
    setRefundBank('');
    setRefundAccount('');
    setRefundHolder('');
    setShowFinalConfirm(false);

    // 팀이 0~1개면 자동 선택 후 다음 단계로
    if (teamNames.length <= 1) {
      if (teamNames.length === 1) setSelectedTeamName(teamNames[0]);
      setReserveStep(isFreeSchedule ? 'confirm' : 'account');
    } else {
      setReserveStep('team');
    }
    setShowReserveModal(true);
  };

  const handleReserve = async () => {
    setReserving(true);
    try {
      const res = await reservationAPI.create({
        scheduleId: schedule.id,
        timeSlotId: selectedSlotId || 0,
        paymentMethod: 'BANK',
        selectedTeamName: selectedTeamName || undefined,
        refundBank: refundBank || undefined,
        refundAccount: refundAccount || undefined,
        refundHolder: refundHolder || undefined,
      });
      setCompletedReservation(res.data);
      setReserveStep('complete');
      setShowFinalConfirm(false);
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
          {hasTicketPrice ? (
            <div className={styles.priceSection}>
              <h3 className={styles.sectionLabel}>입장료</h3>
              <div className={styles.priceList}>
                {schedule.priceA != null && Number(schedule.priceA) > 0 && (
                  <div className={styles.priceItem}>
                    <Ticket size={16} />
                    <span>A석</span>
                    <span className={styles.priceValue}>{Number(schedule.priceA).toLocaleString()}원</span>
                  </div>
                )}
                {schedule.priceS != null && Number(schedule.priceS) > 0 && (
                  <div className={styles.priceItem}>
                    <Ticket size={16} />
                    <span>S석</span>
                    <span className={styles.priceValue}>{Number(schedule.priceS).toLocaleString()}원</span>
                  </div>
                )}
                {schedule.priceR != null && Number(schedule.priceR) > 0 && (
                  <div className={styles.priceItem}>
                    <Ticket size={16} />
                    <span>R석</span>
                    <span className={styles.priceValue}>{Number(schedule.priceR).toLocaleString()}원</span>
                  </div>
                )}
              </div>
            </div>
          ) : schedule.ticketTypes?.includes('무료') ? (
            <div className={styles.priceSection}>
              <h3 className={styles.sectionLabel}>입장료</h3>
              <div className={styles.priceList}>
                <div className={styles.priceItem}>
                  <Ticket size={16} />
                  <span>무료</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* 입금 계좌 정보 */}
          {schedule.bankAccount && hasTicketPrice && (
            <div className={styles.priceSection}>
              <h3 className={styles.sectionLabel}>입금 계좌</h3>
              <div className={styles.priceList}>
                <div className={styles.priceItem}>
                  <Ticket size={16} />
                  <span>{schedule.bankName} {schedule.bankAccount}</span>
                  <span className={styles.priceValue}>{schedule.bankHolder}</span>
                </div>
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
            {/* Step 1: 팀 선택 */}
            {reserveStep === 'team' && (
              <>
                <h3 className={styles.modalTitle}>어떤 팀을 보러 가시나요?</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {teamNames.map(name => (
                    <div
                      key={name}
                      onClick={() => setSelectedTeamName(name)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: selectedTeamName === name
                          ? '2px solid var(--neon-pink)'
                          : '1px solid var(--border-color)',
                        background: selectedTeamName === name
                          ? 'var(--neon-pink-glow, rgba(255,0,128,0.08))'
                          : 'var(--bg-card)',
                        cursor: 'pointer',
                        fontWeight: selectedTeamName === name ? 600 : 400,
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                        fontSize: '0.9375rem'
                      }}
                    >
                      {name}
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={!selectedTeamName}
                  onClick={() => setReserveStep(isFreeSchedule ? 'confirm' : 'account')}
                >
                  다음
                </button>
                <button className={styles.modalClose} onClick={() => setShowReserveModal(false)}>
                  취소
                </button>
              </>
            )}

            {/* Step 2: 환불 계좌 입력 */}
            {reserveStep === 'account' && (
              <>
                <h3 className={styles.modalTitle}>환불 계좌 입력</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '16px', textAlign: 'center' }}>
                  환불이 필요한 경우를 위해 입력해 주세요
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  <select
                    value={refundBank}
                    onChange={e => setRefundBank(e.target.value)}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9375rem',
                      appearance: 'none',
                      WebkitAppearance: 'none'
                    }}
                  >
                    <option value="">은행 선택</option>
                    {BANK_LIST.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="계좌번호"
                    value={refundAccount}
                    onChange={e => setRefundAccount(e.target.value)}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9375rem'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="예금주"
                    value={refundHolder}
                    onChange={e => setRefundHolder(e.target.value)}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9375rem'
                    }}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={!refundBank || !refundAccount || !refundHolder}
                  onClick={() => setReserveStep('confirm')}
                >
                  다음
                </button>
                <button
                  className={styles.modalClose}
                  onClick={() => {
                    if (teamNames.length > 1) {
                      setReserveStep('team');
                    } else {
                      setShowReserveModal(false);
                    }
                  }}
                >
                  {teamNames.length > 1 ? '뒤로' : '취소'}
                </button>
              </>
            )}

            {/* Step 3: 최종 확인 */}
            {reserveStep === 'confirm' && (
              <>
                <h3 className={styles.modalTitle}>예약 확인</h3>
                <div className={styles.modalInfo}>
                  <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {schedule.title}
                  </p>
                  {selectedTeamName && (
                    <p style={{ color: 'var(--neon-pink)', fontSize: '0.875rem', marginBottom: '4px' }}>
                      선택 팀: {selectedTeamName}
                    </p>
                  )}
                  {hasTicketPrice ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {schedule.priceA != null && Number(schedule.priceA) > 0 && (
                        <p className={styles.modalPrice}>A석 {Number(schedule.priceA).toLocaleString()}원</p>
                      )}
                      {schedule.priceS != null && Number(schedule.priceS) > 0 && (
                        <p className={styles.modalPrice}>S석 {Number(schedule.priceS).toLocaleString()}원</p>
                      )}
                      {schedule.priceR != null && Number(schedule.priceR) > 0 && (
                        <p className={styles.modalPrice}>R석 {Number(schedule.priceR).toLocaleString()}원</p>
                      )}
                    </div>
                  ) : (
                    <p className={styles.modalPrice}>무료</p>
                  )}
                  {refundBank && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '8px' }}>
                      환불계좌: {refundBank} {refundAccount} ({refundHolder})
                    </p>
                  )}
                </div>
                {!isFreeSchedule && (
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
                  onClick={() => {
                    if (isFreeSchedule) {
                      handleReserve();
                    } else {
                      setShowFinalConfirm(true);
                    }
                  }}
                  disabled={reserving}
                >
                  {reserving ? '신청 중...' : '최종 예약하기'}
                </button>
                <button
                  className={styles.modalClose}
                  onClick={() => {
                    if (isFreeSchedule) {
                      if (teamNames.length > 1) {
                        setReserveStep('team');
                      } else {
                        setShowReserveModal(false);
                      }
                    } else {
                      setReserveStep('account');
                    }
                  }}
                  disabled={reserving}
                >
                  뒤로
                </button>
              </>
            )}

            {/* 30분 입금 확인 팝업 */}
            {showFinalConfirm && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-lg)',
                zIndex: 10,
                padding: '20px'
              }}>
                <div style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  textAlign: 'center',
                  maxWidth: '280px',
                  width: '100%'
                }}>
                  <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    입금 안내
                  </p>
                  <p style={{ color: 'var(--neon-orange)', fontSize: '0.875rem', marginBottom: '20px', lineHeight: 1.5 }}>
                    예약 신청 후 30분 내로 입금해야 합니다.<br />예약을 진행하시겠습니까?
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={() => setShowFinalConfirm(false)}
                      disabled={reserving}
                    >
                      취소
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={handleReserve}
                      disabled={reserving}
                    >
                      {reserving ? '신청 중...' : '확인'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: 신청 완료 */}
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
                  {!isFreeSchedule && (
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
