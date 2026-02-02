import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, UserCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './common.module.css';

export default function ManagerRequest() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useApp();
  const [form, setForm] = useState({
    teamName: '',
    description: '',
    sns: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
          <h1 className="page-title">아티스트 등록</h1>
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
    // TODO: API 연동
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 500);
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">아티스트 등록</h1>
          <div className={styles.placeholder} />
        </header>
        <div className={styles.unauthorized}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0, 255, 136, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <UserCheck size={40} color="var(--neon-green)" />
          </motion.div>
          <h2 style={{ color: 'var(--text-primary)' }}>요청이 접수되었습니다</h2>
          <p>관리자 검토 후 승인 여부를 알려드립니다</p>
          <button className="btn btn-secondary" onClick={() => navigate('/mypage')}>
            마이페이지로
          </button>
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
        <h1 className="page-title">아티스트 등록 요청</h1>
        <div className={styles.placeholder} />
      </header>

      <motion.form
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onSubmit={handleSubmit}
      >
        <div style={{ padding: 16, background: 'rgba(255, 193, 7, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="#ffc107" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            아티스트 등록이 승인되면 일정 등록 및 관리 권한이 부여됩니다.
            허위 정보로 신청 시 계정이 정지될 수 있습니다.
          </p>
        </div>

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
            value={form.sns}
            onChange={(e) => setForm({ ...form, sns: e.target.value })}
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
      </motion.form>
    </div>
  );
}
