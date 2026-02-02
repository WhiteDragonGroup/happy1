import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Heart, Home, Calendar, User, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const { isLoggedIn } = useApp();

  // 로그인 전: 홈, 스케줄, 로그인
  // 로그인 후: 스케줄, 아티스트, 홈, 내일정, 마이
  const navItems = isLoggedIn
    ? [
        { path: '/explore', icon: Compass, label: '스케줄' },
        { path: '/favorites', icon: Heart, label: '아티스트' },
        { path: '/', icon: Home, label: '홈' },
        { path: '/my-schedule', icon: Calendar, label: '내일정' },
        { path: '/mypage', icon: User, label: '마이' },
      ]
    : [
        { path: '/', icon: Home, label: '홈' },
        { path: '/explore', icon: Compass, label: '스케줄' },
        { path: '/login', icon: LogIn, label: '로그인' },
      ];

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={styles.iconWrap}>
                  {isActive && (
                    <motion.div
                      className={styles.glow}
                      layoutId="navGlow"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <item.icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className={styles.icon}
                  />
                </div>
                <span className={styles.label}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
