import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Search, Shield, UserCheck, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { userAPI } from '../api';
import styles from './common.module.css';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
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
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
    setLoading(false);
  };

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
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchesFilter = filter === 'all' || u.role === filter;
    return matchesSearch && matchesFilter;
  });

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdating(userId);
    try {
      await userAPI.updateRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as UserData['role'] } : u));
    } catch (error) {
      alert('권한 변경에 실패했습니다');
    }
    setUpdating(null);
  };

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
              placeholder="이름, 이메일, 전화번호 검색"
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
              {f === 'all' ? '전체' : f === 'USER' ? '일반회원' : f === 'MANAGER' ? '일정관리자' : '어드민'}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          총 {filteredUsers.length}명
        </p>

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
                    <span className={styles.cardTitle}>{u.name || '이름없음'}</span>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</p>
                    {u.phone && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--neon-cyan)', marginTop: 2 }}>{u.phone}</p>
                    )}
                  </div>
                  <span className={`${styles.badge} ${getRoleBadgeClass(u.role)}`}>
                    {getRoleIcon(u.role)}
                    <span style={{ marginLeft: 4 }}>
                      {u.role === 'ADMIN' ? '관리자' : u.role === 'MANAGER' ? '일정관리자' : '일반회원'}
                    </span>
                  </span>
                </div>
                <p className={styles.cardMeta}>가입일: {new Date(u.createdAt).toLocaleDateString('ko-KR')}</p>
                <div className={styles.cardActions}>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={updating === u.id || u.id === user?.id}
                    style={{ padding: '8px 12px', fontSize: '0.8125rem' }}
                  >
                    <option value="USER">일반회원</option>
                    <option value="MANAGER">일정관리자</option>
                    <option value="ADMIN">관리자</option>
                  </select>
                  {updating === u.id && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>변경 중...</span>}
                  {u.id === user?.id && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(본인)</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
