import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Search, Shield, UserCheck, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './common.module.css';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  createdAt: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: API 연동
    setTimeout(() => {
      setUsers([
        { id: 1, name: '관리자', email: 'admin@stage.com', role: 'ADMIN', createdAt: '2025-01-01' },
        { id: 2, name: '일정관리자', email: 'manager@stage.com', role: 'MANAGER', createdAt: '2025-01-05' },
        { id: 3, name: '테스트유저', email: 'user@stage.com', role: 'USER', createdAt: '2025-01-10' },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  if (user?.role !== 'ADMIN') {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">회원 관리</h1>
          <div className={styles.placeholder} />
        </header>
        <div className={styles.unauthorized}>
          <Shield size={48} />
          <p>관리자 권한이 필요합니다</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.includes(search) || u.email.includes(search);
    const matchesFilter = filter === 'all' || u.role === filter;
    return matchesSearch && matchesFilter;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield size={14} />;
      case 'MANAGER': return <UserCheck size={14} />;
      default: return <User size={14} />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return styles.badgeAdmin;
      case 'MANAGER': return styles.badgeManager;
      default: return styles.badgeUser;
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">회원 관리</h1>
        <div className={styles.placeholder} />
      </header>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* 검색 */}
        <div className={styles.searchBar}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 또는 이메일 검색"
              style={{ paddingLeft: 44 }}
            />
          </div>
        </div>

        {/* 필터 */}
        <div className={styles.filterBar}>
          {['all', 'USER', 'MANAGER', 'ADMIN'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '전체' : f === 'USER' ? '일반회원' : f === 'MANAGER' ? '관리자' : '어드민'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.empty}>
            <p>로딩 중...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.empty}>
            <Users size={48} className={styles.emptyIcon} />
            <p>검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className={styles.cardList}>
            {filteredUsers.map((u, idx) => (
              <motion.div
                key={u.id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <span className={styles.cardTitle}>{u.name}</span>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</p>
                  </div>
                  <span className={`${styles.badge} ${getRoleBadgeClass(u.role)}`}>
                    {getRoleIcon(u.role)}
                    <span style={{ marginLeft: 4 }}>
                      {u.role === 'ADMIN' ? '관리자' : u.role === 'MANAGER' ? '일정관리자' : '일반회원'}
                    </span>
                  </span>
                </div>
                <p className={styles.cardMeta}>가입일: {u.createdAt}</p>
                <div className={styles.cardActions}>
                  <select
                    defaultValue={u.role}
                    onChange={(e) => {
                      // TODO: 역할 변경 API
                      console.log('Change role:', u.id, e.target.value);
                    }}
                    style={{ padding: '8px 12px', fontSize: '0.8125rem' }}
                  >
                    <option value="USER">일반회원</option>
                    <option value="MANAGER">일정관리자</option>
                    <option value="ADMIN">관리자</option>
                  </select>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
