import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Calendar,
  MapPin,
  Search,
  Users,
  LogIn,
  Clock,
  CheckCircle,
  X,
  Ticket
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { reservationAPI } from '../api';
import styles from './ReservationManage.module.css';
import type { Reservation } from '../types';

export default function ReservationManage() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const { user, schedules } = useApp();

  const [reservationList, setReservationList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [entryToast, setEntryToast] = useState<string | null>(null);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInStep, setWalkInStep] = useState<'team' | 'name'>('team');
  const [walkInTeam, setWalkInTeam] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const scannerRef = useRef<any>(null);
  const processingRef = useRef(false);
  const scannerElementId = 'qr-reader';

  const schedule = schedules.find(s => String(s.id) === scheduleId);
  const isManagerOrAdmin = user && schedule
    ? (schedule.managerId === user.id || user.role === 'ADMIN')
    : false;

  // 팀 이름 목록 (팬미팅 제외)
  const teamNames = schedule?.timeSlots
    ? [...new Set(schedule.timeSlots
        .filter(s => s.slotType !== 'FANMEETING')
        .map(s => s.teamName)
        .filter(Boolean) as string[])]
    : [];

  // 현장 발권 처리
  const handleWalkIn = async () => {
    if (!walkInName.trim() || !scheduleId) return;
    setWalkInSubmitting(true);
    try {
      const res = await reservationAPI.walkIn({
        scheduleId: Number(scheduleId),
        walkInName: walkInName.trim(),
        selectedTeamName: walkInTeam || undefined,
      });
      const newReservation = res.data as Reservation;
      setReservationList(prev => [...prev, newReservation]);
      setShowWalkIn(false);
      setWalkInName('');
      setWalkInTeam('');
      setWalkInStep('team');
      // 입장 토스트
      const teamLabel = walkInTeam ? ` [${walkInTeam}]` : '';
      setEntryToast(`${walkInName.trim()}${teamLabel} 현장 발권 완료`);
      setTimeout(() => setEntryToast(null), 5000);
    } catch (err: any) {
      alert(err.response?.data || '현장 발권에 실패했습니다.');
    }
    setWalkInSubmitting(false);
  };

  // 예약자 목록 불러오기
  useEffect(() => {
    if (!scheduleId || !isManagerOrAdmin) return;

    const loadReservations = async () => {
      try {
        const res = await reservationAPI.getBySchedule(Number(scheduleId));
        setReservationList(res.data);
      } catch (err) {
        console.error('Failed to load reservations:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReservations();
  }, [scheduleId, isManagerOrAdmin]);

  // QR 스캐너 시작/정지
  useEffect(() => {
    if (!showScanner) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }

    let mounted = true;

    const startScanner = async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!mounted) return;

      const scanner = new Html5Qrcode(scannerElementId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 5, qrbox: { width: 200, height: 200 } },
          async (decodedText) => {
            // 중복 스캔 방지
            if (processingRef.current) return;
            processingRef.current = true;

            try {
              const res = await reservationAPI.enterByQr(decodedText);
              const enteredReservation = res.data as Reservation;

              // 로컬 state 업데이트
              setReservationList(prev =>
                prev.map(r =>
                  r.id === enteredReservation.id
                    ? { ...r, isEntered: true, enteredAt: enteredReservation.enteredAt, reservationStatus: 'USED' as const }
                    : r
                )
              );

              const name = enteredReservation.userName || '예약자';
              const teamLabel = enteredReservation.selectedTeamName ? ` [${enteredReservation.selectedTeamName}]` : '';
              const entryNum = enteredReservation.entryNumber ? ` (입장번호: ${enteredReservation.entryNumber})` : '';
              setScanResult({ type: 'success', message: `${name}${teamLabel}${entryNum} 입장 처리 완료` });

              // 큰 토스트 알림
              setEntryToast(`${name}${teamLabel} 입장되었습니다`);
              setTimeout(() => setEntryToast(null), 5000);
            } catch (err: any) {
              const msg = err.response?.data || 'QR코드 처리 실패';
              setScanResult({ type: 'error', message: typeof msg === 'string' ? msg : 'QR코드 처리 실패' });
            }

            // 3초 쿨다운 후 다음 스캔 허용
            setTimeout(() => {
              setScanResult(null);
              processingRef.current = false;
            }, 3000);
          },
          () => {} // ignore errors during scanning
        );
      } catch (err) {
        console.error('Failed to start scanner:', err);
        setShowScanner(false);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [showScanner]);

  // 입장 처리 (ID)
  const handleEnter = async (reservationId: number) => {
    try {
      const res = await reservationAPI.enter(reservationId);
      const enteredReservation = res.data as Reservation;
      setReservationList(prev =>
        prev.map(r =>
          r.id === reservationId
            ? { ...r, isEntered: true, enteredAt: enteredReservation.enteredAt, reservationStatus: 'USED' as const }
            : r
        )
      );
      // 입장 토스트
      const reservation = reservationList.find(r => r.id === reservationId);
      const name = reservation?.userName || enteredReservation.userName || '예약자';
      const teamLabel = reservation?.selectedTeamName ? ` [${reservation.selectedTeamName}]` : '';
      setEntryToast(`${name}${teamLabel} 입장되었습니다`);
      setTimeout(() => setEntryToast(null), 5000);
    } catch (err: any) {
      alert(err.response?.data || '입장 처리에 실패했습니다.');
    }
  };

  // 입금 확인
  const handleConfirmPayment = async (reservationId: number) => {
    try {
      await reservationAPI.confirmPayment(reservationId);
      setReservationList(prev =>
        prev.map(r =>
          r.id === reservationId
            ? { ...r, paymentStatus: 'COMPLETED' as const, reservationStatus: 'CONFIRMED' as const }
            : r
        )
      );
    } catch (err: any) {
      alert(err.response?.data || '입금 확인에 실패했습니다.');
    }
  };

  // 입금 확인 취소
  const handleCancelPayment = async (reservationId: number) => {
    try {
      await reservationAPI.cancelPayment(reservationId);
      setReservationList(prev =>
        prev.map(r =>
          r.id === reservationId
            ? { ...r, paymentStatus: 'PENDING' as const, reservationStatus: 'PENDING' as const }
            : r
        )
      );
    } catch (err: any) {
      alert(err.response?.data || '입금 취소에 실패했습니다.');
    }
  };

  // 예약 취소 (매니저)
  const handleManagerCancel = async (reservationId: number) => {
    if (!confirm('이 예약을 취소하시겠습니까?')) return;
    try {
      await reservationAPI.managerCancel(reservationId);
      setReservationList(prev =>
        prev.map(r =>
          r.id === reservationId
            ? { ...r, reservationStatus: 'CANCELLED' as const, paymentStatus: 'CANCELLED' as const }
            : r
        )
      );
    } catch (err: any) {
      alert(err.response?.data || '예약 취소에 실패했습니다.');
    }
  };

  // 입장 취소
  const handleCancelEnter = async (reservationId: number) => {
    try {
      const res = await reservationAPI.cancelEnter(reservationId);
      const updatedReservation = res.data as Reservation;
      setReservationList(prev =>
        prev.map(r =>
          r.id === reservationId
            ? { ...r, isEntered: false, enteredAt: undefined, reservationStatus: updatedReservation.reservationStatus }
            : r
        )
      );
    } catch (err: any) {
      alert(err.response?.data || '입장 취소에 실패했습니다.');
    }
  };

  // 상태별 카운트 (취소 제외한 실예약 수)
  const activeReservations = reservationList.filter(r => r.reservationStatus !== 'CANCELLED');
  const cancelRequestCount = reservationList.filter(r => r.reservationStatus === 'CANCEL_REQUESTED').length;
  const enteredCount = reservationList.filter(r => r.isEntered).length;
  const cancelledCount = reservationList.filter(r => r.reservationStatus === 'CANCELLED').length;

  // 검색 + 상태 필터
  const filteredReservations = useMemo(() => {
    let list = [...reservationList];

    // 상태 필터
    if (statusFilter === 'CANCEL_REQUESTED') {
      list = list.filter(r => r.reservationStatus === 'CANCEL_REQUESTED');
    } else if (statusFilter === 'CANCELLED') {
      list = list.filter(r => r.reservationStatus === 'CANCELLED');
    } else if (statusFilter === 'ACTIVE') {
      list = list.filter(r => r.reservationStatus !== 'CANCELLED' && r.reservationStatus !== 'CANCEL_REQUESTED');
    }
    // ALL = no filter

    // 검색 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        (r.userName || '').toLowerCase().includes(q) ||
        (r.userNickname || '').toLowerCase().includes(q) ||
        (r.userPhone || '').includes(q) ||
        (r.userEmail || '').toLowerCase().includes(q)
      );
    }

    // 정렬: 취소요청 → 미입장 → 입장완료 → 취소
    list.sort((a, b) => {
      const order = (r: Reservation) => {
        if (r.reservationStatus === 'CANCEL_REQUESTED') return 0;
        if (r.reservationStatus === 'CANCELLED') return 3;
        if (r.isEntered) return 2;
        return 1;
      };
      return order(a) - order(b);
    });

    return list;
  }, [reservationList, searchQuery, statusFilter]);

  // 권한 체크
  if (!loading && !isManagerOrAdmin) {
    return (
      <div className="page">
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">예약자 관리</h1>
          <div className={styles.headerRight} />
        </header>
        <div className={styles.forbidden}>
          <p>접근 권한이 없습니다</p>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">예약자 관리</h1>
        <div className={styles.headerRight}>
          <button
            className={styles.iconBtn}
            onClick={() => {
              setShowWalkIn(true);
              setWalkInStep(teamNames.length > 0 ? 'team' : 'name');
              setWalkInTeam('');
              setWalkInName('');
            }}
            title="현장 발권"
          >
            <Ticket size={22} />
          </button>
          <button
            className={`${styles.iconBtn} ${showScanner ? styles.active : ''}`}
            onClick={() => setShowScanner(!showScanner)}
          >
            {showScanner ? <CameraOff size={22} /> : <Camera size={22} />}
          </button>
        </div>
      </header>

      <div className={styles.container}>
        {/* 일정 요약 */}
        {schedule && (
          <div className={styles.scheduleSummary}>
            <h2>{schedule.title}</h2>
            <div className={styles.summaryMeta}>
              <span>
                <Calendar size={14} />
                {new Date(schedule.date).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
                })}
              </span>
              {schedule.venue && (
                <span>
                  <MapPin size={14} />
                  {schedule.venue}
                </span>
              )}
            </div>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statLabel}>예약</div>
                <div className={styles.statValue}>{activeReservations.length}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>입장</div>
                <div className={`${styles.statValue} ${styles.entered}`}>{enteredCount}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>정원</div>
                <div className={styles.statValue}>{schedule.capacity}</div>
              </div>
              {cancelRequestCount > 0 && (
                <div className={styles.stat} onClick={() => setStatusFilter('CANCEL_REQUESTED')} style={{ cursor: 'pointer' }}>
                  <div className={styles.statLabel} style={{ color: 'var(--neon-pink)' }}>취소요청</div>
                  <div className={styles.statValue} style={{ color: 'var(--neon-pink)' }}>{cancelRequestCount}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR 스캐너 */}
        {showScanner && (
          <motion.div
            className={styles.scannerSection}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className={styles.scannerWrapper}>
              <div id={scannerElementId} />
            </div>
            {scanResult && (
              <div className={`${styles.scanResult} ${styles[scanResult.type]}`}>
                {scanResult.message}
              </div>
            )}
          </motion.div>
        )}

        {/* 검색바 */}
        <div className={styles.searchBar}>
          <Search size={16} />
          <input
            type="text"
            placeholder="이름, 전화번호, 이메일 검색"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 상태 필터 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: '전체', count: reservationList.length },
            { key: 'ACTIVE', label: '활성', count: activeReservations.length - cancelRequestCount },
            ...(cancelRequestCount > 0 ? [{ key: 'CANCEL_REQUESTED', label: '취소요청', count: cancelRequestCount }] : []),
            ...(cancelledCount > 0 ? [{ key: 'CANCELLED', label: '취소됨', count: cancelledCount }] : []),
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: statusFilter === f.key ? '1px solid var(--neon-cyan)' : '1px solid var(--border-color)',
                background: statusFilter === f.key ? 'rgba(0,240,255,0.1)' : 'transparent',
                color: f.key === 'CANCEL_REQUESTED' ? 'var(--neon-pink)' : statusFilter === f.key ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* 예약자 리스트 */}
        {loading ? (
          <div className={styles.empty}>
            <p>로딩 중...</p>
          </div>
        ) : filteredReservations.length > 0 ? (
          <div className={styles.reservationList}>
            {filteredReservations.map((reservation, idx) => (
              <motion.div
                key={reservation.id}
                className={`${styles.reservationCard} ${reservation.isEntered ? styles.entered : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <div className={styles.reservationInfo}>
                  <div className={styles.reservationName}>
                    {reservation.entryNumber != null && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: '22px', height: '22px', borderRadius: '50%',
                        background: 'rgba(0, 240, 255, 0.15)', color: 'var(--neon-cyan)',
                        fontSize: '0.6875rem', fontWeight: 700, marginRight: '6px'
                      }}>
                        {reservation.entryNumber}
                      </span>
                    )}
                    {reservation.userName || '이름 없음'}
                    {reservation.userNickname && reservation.userNickname !== reservation.userName && (
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8125rem' }}>
                        {' '}({reservation.userNickname})
                      </span>
                    )}
                  </div>
                  <div className={styles.reservationContact}>
                    {reservation.userPhone || ''} {reservation.userEmail ? `· ${reservation.userEmail}` : ''}
                  </div>
                  {reservation.timeSlot && (
                    <div className={styles.reservationContact} style={{ color: 'var(--neon-blue)' }}>
                      <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                      {reservation.timeSlot.startTime?.slice(0, 5)} - {reservation.timeSlot.endTime?.slice(0, 5)}
                      {reservation.timeSlot.teamName && ` / ${reservation.timeSlot.teamName}`}
                    </div>
                  )}
                  {reservation.selectedTeamName && (
                    <div className={styles.reservationContact} style={{ color: 'var(--neon-pink, #ff0080)' }}>
                      선택 팀: {reservation.selectedTeamName}
                    </div>
                  )}
                  {reservation.refundBank && (
                    <div className={styles.reservationContact} style={{ color: 'var(--text-tertiary, #999)', fontSize: '0.75rem' }}>
                      환불계좌: {reservation.refundBank} {reservation.refundAccount} ({reservation.refundHolder})
                    </div>
                  )}
                  <div className={styles.reservationMeta}>
                    {/* 결제 상태 */}
                    {reservation.paymentStatus === 'COMPLETED' && (
                      <span className={`${styles.badge} ${styles.green}`}>결제완료</span>
                    )}
                    {reservation.paymentStatus === 'PENDING' && (
                      <span className={`${styles.badge} ${styles.orange}`}>입금대기</span>
                    )}
                    {/* 예약 상태 */}
                    {reservation.reservationStatus === 'CONFIRMED' && (
                      <span className={`${styles.badge} ${styles.blue}`}>예약확정</span>
                    )}
                    {reservation.reservationStatus === 'PENDING' && (
                      <span className={`${styles.badge} ${styles.orange}`}>예약대기</span>
                    )}
                    {reservation.reservationStatus === 'USED' && (
                      <span className={`${styles.badge} ${styles.purple}`}>입장완료</span>
                    )}
                    {reservation.reservationStatus === 'CANCEL_REQUESTED' && (
                      <span className={`${styles.badge} ${styles.red}`}>취소요청</span>
                    )}
                    {reservation.reservationStatus === 'CANCELLED' && (
                      <span className={`${styles.badge} ${styles.red}`}>취소</span>
                    )}
                    {/* 결제 방법 */}
                    <span className={styles.badge}>
                      {reservation.paymentMethod === 'CARD' ? '카드' : '계좌이체'}
                    </span>
                  </div>
                  {reservation.createdAt && (
                    <div className={styles.reservationContact} style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      예약: {new Date(reservation.createdAt).toLocaleString('ko-KR', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  )}
                  {reservation.isEntered && reservation.enteredAt && (
                    <div className={styles.enteredTime}>
                      입장: {new Date(reservation.enteredAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>

                <div className={styles.reservationActions}>
                  {reservation.reservationStatus === 'CANCELLED' ? (
                    <span className={`${styles.badge} ${styles.red}`} style={{ padding: '8px 12px', fontSize: '0.8125rem' }}>취소됨</span>
                  ) : (
                    <>
                      {reservation.isEntered ? (
                        <button
                          className={styles.cancelBtn}
                          onClick={() => handleCancelEnter(reservation.id)}
                        >
                          입장취소
                        </button>
                      ) : (
                        <button
                          className={styles.enterBtn}
                          onClick={() => handleEnter(reservation.id)}
                        >
                          <LogIn size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                          입장
                        </button>
                      )}
                      {reservation.paymentStatus === 'COMPLETED' ? (
                        <button
                          className={styles.cancelBtn}
                          onClick={() => handleCancelPayment(reservation.id)}
                        >
                          입금취소
                        </button>
                      ) : reservation.paymentStatus === 'PENDING' && (
                        <button
                          className={styles.confirmBtn}
                          onClick={() => handleConfirmPayment(reservation.id)}
                        >
                          입금확인
                        </button>
                      )}
                      <button
                        className={styles.cancelBtn}
                        onClick={() => handleManagerCancel(reservation.id)}
                        style={{
                          fontSize: '0.75rem', padding: '6px 12px',
                          ...(reservation.isEntered ? { opacity: 0.3, pointerEvents: 'none' as const } : {})
                        }}
                        disabled={reservation.isEntered}
                      >
                        예약취소
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <Users size={48} />
            <p>{searchQuery ? '검색 결과가 없습니다' : '예약자가 없습니다'}</p>
          </div>
        )}
      </div>

      {/* 입장 토스트 알림 */}
      {entryToast && (
        <motion.div
          className={styles.entryToast}
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
        >
          <button
            onClick={() => setEntryToast(null)}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 4
            }}
          >
            <X size={18} />
          </button>
          <CheckCircle size={40} />
          <span>{entryToast}</span>
        </motion.div>
      )}

      {/* 현장 발권 모달 */}
      {showWalkIn && (
        <div className={styles.walkInOverlay} onClick={() => !walkInSubmitting && setShowWalkIn(false)}>
          <motion.div
            className={styles.walkInModal}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {walkInStep === 'team' && teamNames.length > 0 ? (
              <>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>
                  보러 온 팀 선택
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {teamNames.map(name => (
                    <button
                      key={name}
                      onClick={() => setWalkInTeam(name)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: walkInTeam === name
                          ? '2px solid var(--neon-pink)'
                          : '1px solid var(--border-color)',
                        background: walkInTeam === name
                          ? 'rgba(255,0,128,0.08)'
                          : 'var(--bg-card)',
                        cursor: 'pointer',
                        fontWeight: walkInTeam === name ? 600 : 400,
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                        fontSize: '0.9375rem'
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={!walkInTeam}
                  onClick={() => setWalkInStep('name')}
                >
                  다음
                </button>
                <button
                  style={{
                    width: '100%', marginTop: 8, padding: 12,
                    background: 'transparent', border: 'none',
                    color: 'var(--text-muted)', fontSize: '0.875rem', cursor: 'pointer'
                  }}
                  onClick={() => setShowWalkIn(false)}
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>
                  현장 발권
                </h3>
                {walkInTeam && (
                  <p style={{ textAlign: 'center', color: 'var(--neon-pink)', fontSize: '0.875rem', marginBottom: 12 }}>
                    팀: {walkInTeam}
                  </p>
                )}
                <input
                  type="text"
                  placeholder="이름 또는 닉네임 입력"
                  value={walkInName}
                  onChange={e => setWalkInName(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%', padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    marginBottom: 16
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && walkInName.trim()) handleWalkIn();
                  }}
                />
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={!walkInName.trim() || walkInSubmitting}
                  onClick={handleWalkIn}
                >
                  {walkInSubmitting ? '처리 중...' : '발권 완료'}
                </button>
                <button
                  style={{
                    width: '100%', marginTop: 8, padding: 12,
                    background: 'transparent', border: 'none',
                    color: 'var(--text-muted)', fontSize: '0.875rem', cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (teamNames.length > 0 && walkInStep === 'name') {
                      setWalkInStep('team');
                    } else {
                      setShowWalkIn(false);
                    }
                  }}
                  disabled={walkInSubmitting}
                >
                  {teamNames.length > 0 && walkInStep === 'name' ? '이전' : '취소'}
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
