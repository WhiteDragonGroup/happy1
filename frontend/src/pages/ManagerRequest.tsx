import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, UserCheck, AlertCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { managerRequestAPI } from '../api';
import styles from './common.module.css';

interface RequestHistory {
  id: number;
  teamName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  createdAt: string;
  processedAt?: string;
}

export default function ManagerRequest() {
  const navigate = useNavigate();
  const { user, isLoggedIn, refreshUser } = useApp();
  const [form, setForm] = useState({
    teamName: '',
    description: '',
    snsLink: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<RequestHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'USER') {
      loadRequests();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  const loadRequests = async () => {
    try {
      const res = await managerRequestAPI.getAll();
      setRequests(res.data);
      // 승인된 요청이 있으면 사용자 정보 새로고침
      if (res.data.some((r: RequestHistory) => r.status === 'APPROVED')) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
    setLoading(false);
  };

  const hasPendingRequest = requests.some(r => r.status === 'PENDING');

  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">주최자 등록</h1>
          <div className={styles.placeholder} />
        </header>
        <div className={styles.unauthorized}>
          <UserCheck size={48} />
          <p>이미 일정관리자 권한을 보유하고 있습니다</p>
          <button className="btn btn-primary" onClick={() => navigate('/mypage/create-schedule')}>
            일정 등록하기
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await managerRequestAPI.create({
        teamName: form.teamName,
        description: form.description,
        snsLink: form.snsLink || undefined,
        reason: form.reason
      });
      // 요청 목록 새로고침
      await loadRequests();
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('요청 처리 중 오류가 발생했습니다');
      }
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">주최자 등록신청</h1>
          <div className={styles.placeholder} />
        </header>
        <div className={styles.empty}>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">주최자 등록신청</h1>
        <div className={styles.placeholder} />
      </header>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* 요청 내역 */}
        {requests.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12 }}>요청 내역</h3>
            <div className={styles.cardList}>
              {requests.map((req) => (
                <div key={req.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>{req.teamName}</span>
                    <span className={`${styles.badge} ${
                      req.status === 'APPROVED' ? styles.badgeApproved :
                      req.status === 'REJECTED' ? styles.badgeRejected : styles.badgePending
                    }`}>
                      {req.status === 'APPROVED' ? '승인됨' : req.status === 'REJECTED' ? '거절됨' : '대기중'}
                    </span>
                  </div>
                  {req.status === 'PENDING' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      <Clock size={14} />
                      <span>관리자 검토 중입니다</span>
                    </div>
                  )}
                  {req.status === 'REJECTED' && req.rejectReason && (
                    <div style={{ marginTop: 8, padding: 12, background: 'rgba(255, 26, 92, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--neon-pink)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--neon-pink)', marginBottom: 4 }}>거절 사유</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{req.rejectReason}</p>
                    </div>
                  )}
                  {req.status === 'APPROVED' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: 'var(--neon-green)', fontSize: '0.875rem' }}>
                      <UserCheck size={14} />
                      <span>승인되었습니다! 일정을 등록할 수 있습니다.</span>
                    </div>
                  )}
                  <span className={styles.cardMeta}>
                    신청일: {new Date(req.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 대기 중인 요청이 있으면 폼 숨김 */}
        {hasPendingRequest ? (
          <div style={{ padding: 16, background: 'rgba(0, 240, 255, 0.1)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Clock size={20} color="var(--neon-cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              이미 대기 중인 요청이 있습니다. 관리자 검토 후 결과를 알려드립니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ padding: 16, background: 'rgba(255, 193, 7, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AlertCircle size={20} color="#ffc107" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                주최자 등록이 승인되면 일정 등록 및 관리 권한이 부여됩니다.
                허위 정보로 신청 시 계정이 정지될 수 있습니다.
              </p>
            </div>

            {error && (
              <div style={{ padding: 16, background: 'rgba(255, 26, 92, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 24, color: 'var(--neon-pink)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className={styles.section}>
              <label className={styles.label}>
                팀/아티스트명 <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={form.teamName}
                onChange={(e) => setForm({ ...form, teamName: e.target.value })}
                placeholder="팀 또는 아티스트 이름"
                required
              />
            </div>

            <div className={styles.section}>
              <label className={styles.label}>
                소개 <span className={styles.required}>*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="팀/아티스트 소개를 입력하세요"
                required
              />
            </div>

            <div className={styles.section}>
              <label className={styles.label}>SNS 링크</label>
              <input
                type="url"
                value={form.snsLink}
                onChange={(e) => setForm({ ...form, snsLink: e.target.value })}
                placeholder="https://instagram.com/..."
              />
              <p className={styles.hint}>활동을 증명할 수 있는 SNS 링크</p>
            </div>

            <div className={styles.section}>
              <label className={styles.label}>
                신청 사유 <span className={styles.required}>*</span>
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="아티스트 등록을 요청하는 이유를 적어주세요"
                required
              />
            </div>

            <div className={styles.submitSection}>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? '제출 중...' : '등록 요청'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
