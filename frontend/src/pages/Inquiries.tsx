import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Plus, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { inquiryAPI } from '../api';
import styles from './common.module.css';

interface Inquiry {
  id: number;
  title: string;
  content: string;
  status: 'PENDING' | 'ANSWERED';
  createdAt: string;
  answer?: string;
  answeredAt?: string;
  userName?: string;
  userEmail?: string;
}

export default function Inquiries() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [newInquiry, setNewInquiry] = useState({ title: '', content: '' });
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answerText, setAnswerText] = useState<{ [key: number]: string }>({});
  const [answeringId, setAnsweringId] = useState<number | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isLoggedIn) {
      loadInquiries();
    }
  }, [isLoggedIn]);

  const loadInquiries = async () => {
    try {
      const res = isAdmin ? await inquiryAPI.getAllAdmin() : await inquiryAPI.getAll();
      setInquiries(res.data);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
    }
    setLoading(false);
  };

  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInquiry.title.trim() || !newInquiry.content.trim()) {
      alert('제목과 내용을 입력해주세요');
      return;
    }

    setSubmitting(true);
    try {
      const res = await inquiryAPI.create(newInquiry);
      setInquiries([res.data, ...inquiries]);
      setShowForm(false);
      setNewInquiry({ title: '', content: '' });
      alert('문의가 등록되었습니다');
    } catch (error) {
      console.error('Failed to create inquiry:', error);
      alert('문의 등록에 실패했습니다');
    }
    setSubmitting(false);
  };

  const handleAnswer = async (id: number) => {
    const answer = answerText[id];
    if (!answer?.trim()) {
      alert('답변을 입력해주세요');
      return;
    }

    setAnsweringId(id);
    try {
      await inquiryAPI.answer(id, answer);
      setInquiries(inquiries.map(inq =>
        inq.id === id ? { ...inq, status: 'ANSWERED' as const, answer } : inq
      ));
      setAnswerText({ ...answerText, [id]: '' });
    } catch (error) {
      console.error('Failed to answer:', error);
      alert('답변 등록에 실패했습니다');
    }
    setAnsweringId(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">{isAdmin ? '문의 관리' : '문의 내역'}</h1>
        {!isAdmin && (
          <button className={styles.headerBtn} onClick={() => setShowForm(!showForm)}>
            <Plus size={24} />
          </button>
        )}
        {isAdmin && <div className={styles.placeholder} />}
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
            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? '등록 중...' : '문의 등록'}
            </button>
          </motion.form>
        )}

        {loading ? (
          <div className={styles.empty}>
            <p>로딩 중...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className={styles.empty}>
            <MessageSquare size={48} className={styles.emptyIcon} />
            <p>문의 내역이 없습니다</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              문의하기
            </button>
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
                  <div>
                    <span className={styles.cardTitle}>{inquiry.title}</span>
                    {isAdmin && inquiry.userName && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {inquiry.userName} ({inquiry.userEmail})
                      </p>
                    )}
                  </div>
                  <span className={`${styles.badge} ${inquiry.status === 'ANSWERED' ? styles.badgeApproved : styles.badgePending}`}>
                    {inquiry.status === 'ANSWERED' ? '답변완료' : '대기중'}
                  </span>
                </div>
                <p className={styles.cardContent}>{inquiry.content}</p>
                {inquiry.answer && (
                  <div style={{ marginTop: 12, padding: 12, background: 'rgba(0, 240, 255, 0.05)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--neon-cyan)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', marginBottom: 4 }}>답변</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{inquiry.answer}</p>
                  </div>
                )}
                {isAdmin && inquiry.status === 'PENDING' && (
                  <div style={{ marginTop: 12 }}>
                    <textarea
                      value={answerText[inquiry.id] || ''}
                      onChange={(e) => setAnswerText({ ...answerText, [inquiry.id]: e.target.value })}
                      placeholder="답변을 입력하세요"
                      style={{ marginBottom: 8, width: '100%', minHeight: 80 }}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAnswer(inquiry.id)}
                      disabled={answeringId === inquiry.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Send size={14} />
                      {answeringId === inquiry.id ? '등록 중...' : '답변 등록'}
                    </button>
                  </div>
                )}
                <span className={styles.cardMeta}>
                  {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
