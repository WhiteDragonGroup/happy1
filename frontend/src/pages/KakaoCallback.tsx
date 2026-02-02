import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authAPI } from '../api';

export default function KakaoCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthResponse } = useApp();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      handleKakaoCallback(code);
    } else {
      setError('인증 코드가 없습니다.');
    }
  }, [searchParams]);

  const handleKakaoCallback = async (code: string) => {
    try {
      // 백엔드에 인가코드 전송
      const res = await authAPI.kakaoCallback(code);
      await setAuthResponse(res.data.token, res.data.user);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('카카오 로그인 처리 실패:', err);
      setError('로그인 처리 중 오류가 발생했습니다.');
    }
  };

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '16px'
      }}>
        <p>{error}</p>
        <button onClick={() => navigate('/login')}>로그인 페이지로</button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh'
    }}>
      <p>로그인 처리 중...</p>
    </div>
  );
}
