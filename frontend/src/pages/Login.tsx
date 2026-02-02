import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { kakaoLogin, login } = useApp();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(username, password);

    if (success) {
      navigate('/');
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다');
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
          <h1 className={styles.logo}>UNDERPASS</h1>
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

        {!showAdminLogin ? (
          <>
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
              <span>OR</span>
            </div>

            <button
              type="button"
              className={styles.adminToggle}
              onClick={() => setShowAdminLogin(true)}
            >
              <Shield size={18} />
              관리자 로그인
            </button>
          </>
        ) : (
          <motion.form
            className={styles.form}
            onSubmit={handleAdminLogin}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={styles.inputGroup}>
              <label>아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>비밀번호</label>
              <div className={styles.passwordWrap}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>

            <button
              type="button"
              className={styles.backToKakao}
              onClick={() => setShowAdminLogin(false)}
            >
              ← 카카오 로그인으로 돌아가기
            </button>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
