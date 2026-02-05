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
  Clock
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
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const scannerRef = useRef<any>(null);
  const scannerElementId = 'qr-reader';

  const schedule = schedules.find(s => String(s.id) === scheduleId);
  const isManagerOrAdmin = user && schedule
    ? (schedule.managerId === user.id || user.role === 'ADMIN')
    : false;

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
          { fps: 10, qrbox: { width: 200, height: 200 } },
          async (decodedText) => {
            // 스캔 성공
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

              setScanResult({ type: 'success', message: `${enteredReservation.userName || '예약자'} 입장 처리 완료` });
            } catch (err: any) {
              const msg = err.response?.data || 'QR코드 처리 실패';
              setScanResult({ type: 'error', message: typeof msg === 'string' ? msg : 'QR코드 처리 실패' });
            }

            // 3초 후 결과 메시지 제거
            setTimeout(() => setScanResult(null), 3000);
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

  // 검색 필터
  const filteredReservations = useMemo(() => {
    let list = [...reservationList];

    // 검색 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        (r.userName || '').toLowerCase().includes(q) ||
        (r.userPhone || '').includes(q) ||
        (r.userEmail || '').toLowerCase().includes(q)
      );
    }

    // 정렬: 미입장 → 입장완료
    list.sort((a, b) => {
      if (a.isEntered && !b.isEntered) return 1;
      if (!a.isEntered && b.isEntered) return -1;
      return 0;
    });

    return list;
  }, [reservationList, searchQuery]);

  const enteredCount = reservationList.filter(r => r.isEntered).length;

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
                <div className={styles.statLabel}>총 예약</div>
                <div className={styles.statValue}>{reservationList.length}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>입장 완료</div>
                <div className={`${styles.statValue} ${styles.entered}`}>{enteredCount}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>정원</div>
                <div className={styles.statValue}>{schedule.capacity}</div>
              </div>
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
                    {reservation.userName || '이름 없음'}
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
                    {/* 결제 방법 */}
                    <span className={styles.badge}>
                      {reservation.paymentMethod === 'CARD' ? '카드' : '계좌이체'}
                    </span>
                  </div>
                  {reservation.isEntered && reservation.enteredAt && (
                    <div className={styles.enteredTime}>
                      입장: {new Date(reservation.enteredAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>

                <div className={styles.reservationActions}>
                  {!reservation.isEntered && (
                    <button
                      className={styles.enterBtn}
                      onClick={() => handleEnter(reservation.id)}
                    >
                      <LogIn size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                      입장
                    </button>
                  )}
                  {reservation.paymentStatus === 'PENDING' && (
                    <button
                      className={styles.confirmBtn}
                      onClick={() => handleConfirmPayment(reservation.id)}
                    >
                      입금확인
                    </button>
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
    </div>
  );
}
