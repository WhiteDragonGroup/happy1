import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { userAPI } from '../api';
import styles from './common.module.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoggedIn, setUser } = useApp();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await userAPI.updateMe(form);
      setUser(res.data);
      alert('저장되었습니다');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('저장에 실패했습니다');
    }

    setIsSubmitting(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">개인정보 변경</h1>
        <div className={styles.placeholder} />
      </header>

      <motion.form
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onSubmit={handleSubmit}
      >
        {/* 프로필 이미지 */}
        <div className={styles.section} style={{ textAlign: 'center' }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            border: '2px solid var(--border-color)',
            position: 'relative',
            cursor: 'pointer'
          }}>
            {user?.profileImage ? (
              <img src={user.profileImage} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <User size={40} color="var(--text-muted)" />
            )}
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--neon-pink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Camera size={16} color="white" />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>프로필 사진 변경</p>
        </div>

        {/* 이름 */}
        <div className={styles.section}>
          <label className={styles.label}>이름</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="이름을 입력하세요"
          />
        </div>

        {/* 이메일 */}
        <div className={styles.section}>
          <label className={styles.label}>이메일</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="이메일을 입력하세요"
          />
        </div>

        {/* 연락처 */}
        <div className={styles.section}>
          <label className={styles.label}>연락처</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="연락처를 입력하세요"
          />
        </div>

        <div className={styles.submitSection}>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
