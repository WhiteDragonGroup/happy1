import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  MessageSquare,
  UserCheck,
  LogOut,
  ChevronRight,
  CalendarPlus,
  Settings,
  Users,
  Shield,
  List,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './MyPage.module.css';

interface MenuItem {
  icon: typeof User;
  label: string;
  path: string;
  badge?: string;
  description?: string;
}

export default function MyPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useApp();

  if (!isLoggedIn) {
    return (
      <div className="page">
        <header className="page-header">
          <h1 className="page-title">마이페이지</h1>
        </header>
        <div className={styles.loginPrompt}>
          <div className={styles.logoWrap}>
            <span className={styles.logo}>UNDERPASS</span>
          </div>
          <h2>로그인하고 시작하세요</h2>
          <p>아티스트 찜, 스케줄 알림 등 다양한 서비스를 이용해보세요</p>
          <button
            className="btn btn-primary btn-full"
            onClick={() => navigate('/login')}
          >
            카카오로 시작하기
          </button>
        </div>
      </div>
    );
  }

  // 일반 회원 메뉴
  const memberMenus: MenuItem[] = [
    { icon: User, label: '개인정보 변경', path: '/mypage/profile', description: '프로필 및 연락처 수정' },
    { icon: MessageSquare, label: '문의 내역', path: '/mypage/inquiries', description: '1:1 문의 내역' },
    { icon: UserCheck, label: '아티스트 등록 요청', path: '/mypage/manager-request', description: '아티스트 페이지 관리 권한 요청' },
  ];

  // 일정관리자 추가 메뉴
  const managerMenus: MenuItem[] = [
    { icon: CalendarPlus, label: '일정 등록', path: '/mypage/create-schedule', description: '새 공연 일정 등록' },
    { icon: Settings, label: '일정 관리', path: '/mypage/manage-schedules', description: '등록한 일정 관리' },
  ];

  // 어드민 추가 메뉴
  const adminMenus: MenuItem[] = [
    { icon: Users, label: '전체 회원 관리', path: '/admin/users', description: '모든 회원 조회 및 관리' },
    { icon: List, label: '전체 일정 관리', path: '/admin/schedules', description: '모든 일정 조회 및 관리' },
    { icon: Shield, label: '아티스트 요청 관리', path: '/admin/requests', description: '아티스트 등록 요청 처리' },
    { icon: Trash2, label: '삭제된 일정', path: '/admin/deleted', description: '삭제된 일정 복구' },
  ];

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <span className={`${styles.roleBadge} ${styles.admin}`}>관리자</span>;
      case 'MANAGER':
        return <span className={`${styles.roleBadge} ${styles.manager}`}>일정관리자</span>;
      default:
        return <span className={`${styles.roleBadge} ${styles.member}`}>일반회원</span>;
    }
  };

  const renderMenuSection = (title: string, menus: MenuItem[]) => (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.menuList}>
        {menus.map((menu, idx) => (
          <motion.button
            key={menu.path}
            className={styles.menuItem}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => navigate(menu.path)}
          >
            <div className={styles.menuIcon}>
              <menu.icon size={20} />
            </div>
            <div className={styles.menuContent}>
              <span className={styles.menuLabel}>
                {menu.label}
                {menu.badge && (
                  <span className={styles.menuBadge}>{menu.badge}</span>
                )}
              </span>
              {menu.description && (
                <span className={styles.menuDesc}>{menu.description}</span>
              )}
            </div>
            <ChevronRight size={18} className={styles.menuArrow} />
          </motion.button>
        ))}
      </div>
    </section>
  );

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">마이페이지</h1>
      </header>

      <div className={styles.container}>
        {/* 프로필 영역 */}
        <motion.div
          className={styles.profileCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.profileImage}>
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} />
            ) : (
              <User size={32} />
            )}
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>
              {user?.name}
              {getRoleBadge()}
            </div>
            <span className={styles.profileEmail}>{user?.email}</span>
          </div>
        </motion.div>

        {/* 기본 메뉴 */}
        {renderMenuSection('계정', memberMenus)}

        {/* 일정관리자 메뉴 */}
        {isManager && renderMenuSection('일정 관리', managerMenus)}

        {/* 어드민 메뉴 */}
        {isAdmin && renderMenuSection('관리자', adminMenus)}

        {/* 로그아웃 */}
        <section className={styles.section}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={20} />
            로그아웃
          </button>
        </section>

        {/* 회원탈퇴 */}
        <button className={styles.withdrawBtn}>
          회원탈퇴
        </button>
      </div>
    </div>
  );
}