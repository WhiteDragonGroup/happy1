import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, UserCheck, Shield, Check, X, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { managerRequestAPI } from '../api';
import styles from './common.module.css';

interface ManagerRequest {
  id: number;
  userName: string;
  userEmail: string;
  teamName: string;
  description: string;
  snsLink?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export default function AdminRequests() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [requests, setRequests] = useState<ManagerRequest[]>([]);
  const [filter, setFilter] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await managerRequestAPI.getAllAdmin();
      setRequests(res.data);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
    setLoading(false);
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
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

  const handleApprove = async (id: number) => {
    if (!confirm('승인하시겠습니까?')) return;
    try {
      await managerRequestAPI.approve(id);
      setRequests(requests.map(r =>
        r.id === id ? { ...r, status: 'APPROVED' as const } : r
      ));
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('승인 처리에 실패했습니다');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('거절 사유를 입력하세요:');
    if (!reason) return;
    try {
      await managerRequestAPI.reject(id, reason);
      setRequests(requests.map(r =>
        r.id === id ? { ...r, status: 'REJECTED' as const } : r
      ));
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('거절 처리에 실패했습니다');
    }
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
            { key: 'PENDING', label: '대기중' },
            { key: 'APPROVED', label: '승인됨' },
            { key: 'REJECTED', label: '거절됨' },
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
                    req.status === 'APPROVED' ? styles.badgeApproved :
                    req.status === 'REJECTED' ? styles.badgeRejected : styles.badgePending
                  }`}>
                    {req.status === 'APPROVED' ? '승인됨' : req.status === 'REJECTED' ? '거절됨' : '대기중'}
                  </span>
                </div>

                <div className={styles.cardContent}>
                  <p style={{ marginBottom: 8 }}><strong>소개:</strong> {req.description}</p>
                  <p style={{ marginBottom: 8 }}><strong>신청사유:</strong> {req.reason}</p>
                  {req.snsLink && (
                    <a href={req.snsLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--neon-cyan)', fontSize: '0.875rem' }}>
                      <ExternalLink size={14} />
                      SNS 링크
                    </a>
                  )}
                </div>

                <p className={styles.cardMeta}>신청일: {req.createdAt}</p>

                <div className={styles.cardActions}>
                  {req.status !== 'APPROVED' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApprove(req.id)}
                    >
                      <Check size={14} />
                      승인
                    </button>
                  )}
                  {req.status !== 'REJECTED' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--neon-pink)' }}
                      onClick={() => handleReject(req.id)}
                    >
                      <X size={14} />
                      거절
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
