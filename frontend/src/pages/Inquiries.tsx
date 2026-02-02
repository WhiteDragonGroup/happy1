import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './common.module.css';

interface Inquiry {
  id: number;
  title: string;
  content: string;
  status: 'pending' | 'answered';
  createdAt: string;
  answer?: string;
}

export default function Inquiries() {
  const navigate = useNavigate();
  const { isLoggedIn } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [newInquiry, setNewInquiry] = useState({ title: '', content: '' });

  // 더미 데이터
  const [inquiries] = useState<Inquiry[]>([
    {
      id: 1,
      title: '일정 취소 문의',
      content: '예약한 일정을 취소하고 싶습니다.',
      status: 'answered',
      createdAt: '2025-01-15',
      answer: '마이페이지에서 예약 취소가 가능합니다.'
    },
    {
      id: 2,
      title: '팀 등록 관련',
      content: '새로운 팀을 등록하고 싶습니다.',
      status: 'pending',
      createdAt: '2025-01-20'
    }
  ]);

  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('문의가 등록되었습니다');
    setShowForm(false);
    setNewInquiry({ title: '', content: '' });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">문의 내역</h1>
        <button className={styles.backBtn} onClick={() => setShowForm(!showForm)}>
          <Plus size={24} />
        </button>
      </header>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.section}
            onSubmit={handleSubmit}
            style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 24 }}
          >
            <div className={styles.section}>
              <label className={styles.label}>제목</label>
              <input
                type="text"
                value={newInquiry.title}
                onChange={(e) => setNewInquiry({ ...newInquiry, title: e.target.value })}
                placeholder="문의 제목"
                required
              />
            </div>
            <div className={styles.section}>
              <label className={styles.label}>내용</label>
              <textarea
                value={newInquiry.content}
                onChange={(e) => setNewInquiry({ ...newInquiry, content: e.target.value })}
                placeholder="문의 내용을 입력하세요"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full">
              문의 등록
            </button>
          </motion.form>
        )}

        {inquiries.length === 0 ? (
          <div className={styles.empty}>
            <MessageSquare size={48} className={styles.emptyIcon} />
            <p>문의 내역이 없습니다</p>
          </div>
        ) : (
          <div className={styles.cardList}>
            {inquiries.map((inquiry, idx) => (
              <motion.div
                key={inquiry.id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>{inquiry.title}</span>
                  <span className={`${styles.badge} ${inquiry.status === 'answered' ? styles.badgeApproved : styles.badgePending}`}>
                    {inquiry.status === 'answered' ? '답변완료' : '대기중'}
                  </span>
                </div>
                <p className={styles.cardContent}>{inquiry.content}</p>
                {inquiry.answer && (
                  <div style={{ marginTop: 12, padding: 12, background: 'rgba(0, 240, 255, 0.05)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--neon-cyan)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', marginBottom: 4 }}>답변</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{inquiry.answer}</p>
                  </div>
                )}
                <span className={styles.cardMeta}>{inquiry.createdAt}</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
