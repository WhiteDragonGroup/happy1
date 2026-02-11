import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { kakaoLogin, login } = useApp();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTestLogin, setShowTestLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleKakaoLogin = async () => {
    setError('');
    setIsLoading(true);

    const success = await kakaoLogin();

    if (success) {
      navigate(-1);
    } else {
      setError('카카오 로그인에 실패했습니다');
    }

    setIsLoading(false);
  };

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError('');
    setIsLoading(true);

    const success = await login(username, password);

    if (success) {
      navigate('/');
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다');
    }

    setIsLoading(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
      </header>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.logoSection}>
          <h1 className={styles.logo}>STAGE</h1>
          <p className={styles.subtitle}>지하에서 시작되는 무대</p>
        </div>

        {error && (
          <motion.div
            className={styles.error}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <button
          type="button"
          className={styles.kakaoBtn}
          onClick={handleKakaoLogin}
          disabled={isLoading}
        >
          <svg className={styles.kakaoIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.644 1.75 4.977 4.397 6.319-.193.727-.699 2.635-.8 3.046-.124.5.184.494.387.36.159-.105 2.529-1.722 3.559-2.421.483.066.977.1 1.457.1 5.523 0 10-3.463 10-7.404C21 6.463 17.523 3 12 3z"/>
          </svg>
          {isLoading ? '로그인 중...' : '카카오로 시작하기'}
        </button>

        <div className={styles.orDivider}>
          <span>or</span>
        </div>

        <button
          type="button"
          className={styles.adminToggle}
          onClick={() => setShowTestLogin(!showTestLogin)}
        >
          <KeyRound size={18} />
          {showTestLogin ? '테스트 로그인 닫기' : '테스트 계정 로그인'}
        </button>

        {showTestLogin && (
          <motion.form
            className={styles.form}
            onSubmit={handleTestLogin}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginTop: '16px' }}
          >
            <div className={styles.inputGroup}>
              <label>아이디</label>
              <input
                type="text"
                placeholder="아이디 입력"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading || !username || !password}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
