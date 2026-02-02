import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, UserCheck, Shield, Check, X, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './common.module.css';

interface ManagerRequest {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  teamName: string;
  description: string;
  sns?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminRequests() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [requests, setRequests] = useState<ManagerRequest[]>([]);
  const [filter, setFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: API 연동
    setTimeout(() => {
      setRequests([
        {
          id: 1,
          userId: 5,
          userName: '김아이돌',
          userEmail: 'idol@test.com',
          teamName: '드림캐쳐',
          description: '인디씬에서 활동하는 5인조 밴드입니다',
          sns: 'https://instagram.com/dreamcatcher',
          reason: '정기 공연 일정을 등록하고 싶습니다',
          status: 'pending',
          createdAt: '2025-01-20'
        },
        {
          id: 2,
          userId: 6,
          userName: '박솔로',
          userEmail: 'solo@test.com',
          teamName: '박솔로',
          description: '어쿠스틱 싱어송라이터',
          reason: '버스킹 및 소규모 공연 일정 공유',
          status: 'approved',
          createdAt: '2025-01-15'
        }
      ]);
      setLoading(false);
    }, 300);
  }, []);

  if (user?.role !== 'ADMIN') {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">요청 관리</h1>
          <div className={styles.placeholder} />
        </header>
        <div className={styles.unauthorized}>
          <Shield size={48} />
          <p>관리자 권한이 필요합니다</p>
        </div>
      </div>
    );
  }

  const filteredRequests = requests.filter(r =>
    filter === 'all' || r.status === filter
  );

  const handleApprove = (id: number) => {
    if (!confirm('승인하시겠습니까?')) return;
    setRequests(requests.map(r =>
      r.id === id ? { ...r, status: 'approved' as const } : r
    ));
    // TODO: API 호출
  };

  const handleReject = (id: number) => {
    if (!confirm('거절하시겠습니까?')) return;
    setRequests(requests.map(r =>
      r.id === id ? { ...r, status: 'rejected' as const } : r
    ));
    // TODO: API 호출
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">아티스트 요청 관리</h1>
        <div className={styles.placeholder} />
      </header>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* 필터 */}
        <div className={styles.filterBar}>
          {[
            { key: 'pending', label: '대기중' },
            { key: 'approved', label: '승인됨' },
            { key: 'rejected', label: '거절됨' },
            { key: 'all', label: '전체' }
          ].map(f => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.active : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.empty}>
            <p>로딩 중...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className={styles.empty}>
            <UserCheck size={48} className={styles.emptyIcon} />
            <p>요청이 없습니다</p>
          </div>
        ) : (
          <div className={styles.cardList}>
            {filteredRequests.map((req, idx) => (
              <motion.div
                key={req.id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <span className={styles.cardTitle}>{req.teamName}</span>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {req.userName} ({req.userEmail})
                    </p>
                  </div>
                  <span className={`${styles.badge} ${
                    req.status === 'approved' ? styles.badgeApproved :
                    req.status === 'rejected' ? styles.badgeRejected : styles.badgePending
                  }`}>
                    {req.status === 'approved' ? '승인됨' : req.status === 'rejected' ? '거절됨' : '대기중'}
                  </span>
                </div>

                <div className={styles.cardContent}>
                  <p style={{ marginBottom: 8 }}><strong>소개:</strong> {req.description}</p>
                  <p style={{ marginBottom: 8 }}><strong>신청사유:</strong> {req.reason}</p>
                  {req.sns && (
                    <a href={req.sns} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--neon-cyan)', fontSize: '0.875rem' }}>
                      <ExternalLink size={14} />
                      SNS 링크
                    </a>
                  )}
                </div>

                <p className={styles.cardMeta}>신청일: {req.createdAt}</p>

                {req.status === 'pending' && (
                  <div className={styles.cardActions}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApprove(req.id)}
                    >
                      <Check size={14} />
                      승인
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--neon-pink)' }}
                      onClick={() => handleReject(req.id)}
                    >
                      <X size={14} />
                      거절
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
