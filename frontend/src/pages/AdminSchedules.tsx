import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Search, Trash2, Eye, EyeOff, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { scheduleAPI } from '../api';
import styles from './common.module.css';

export default function AdminSchedules() {
  const navigate = useNavigate();
  const { user, schedules, refreshData } = useApp();
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  if (user?.role !== 'ADMIN') {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">전체 일정 관리</h1>
          <div className={styles.placeholder} />
        </header>
        <div className={styles.unauthorized}>
          <Shield size={48} />
          <p>관리자 권한이 필요합니다</p>
        </div>
      </div>
    );
  }

  const activeSchedules = schedules.filter(s => !s.isDeleted);
  const filteredSchedules = activeSchedules.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.team?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setDeleting(id);
    try {
      await scheduleAPI.delete(id);
      await refreshData();
    } catch (error) {
      alert('삭제에 실패했습니다');
    }
    setDeleting(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">전체 일정 관리</h1>
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
              placeholder="일정 또는 팀 이름 검색"
              style={{ paddingLeft: 44 }}
            />
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          총 {filteredSchedules.length}개의 일정
        </p>

        {filteredSchedules.length === 0 ? (
          <div className={styles.empty}>
            <Calendar size={48} className={styles.emptyIcon} />
            <p>일정이 없습니다</p>
          </div>
        ) : (
          <div className={styles.cardList}>
            {filteredSchedules.map((schedule, idx) => (
              <motion.div
                key={schedule.id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <span className={styles.cardTitle}>{schedule.title}</span>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--neon-cyan)', marginTop: 4 }}>
                      {schedule.team?.name}
                    </p>
                  </div>
                  <span className={`${styles.badge} ${schedule.isPublished ? styles.badgeApproved : styles.badgePending}`}>
                    {schedule.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span style={{ marginLeft: 4 }}>{schedule.isPublished ? '공개' : '비공개'}</span>
                  </span>
                </div>
                <p className={styles.cardMeta}>
                  {new Date(schedule.date).toLocaleDateString('ko-KR')} | {schedule.venue || '장소 미정'}
                </p>
                <div className={styles.cardActions}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/schedule/${schedule.id}`)}
                  >
                    상세보기
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--neon-pink)' }}
                    onClick={() => handleDelete(schedule.id)}
                    disabled={deleting === schedule.id}
                  >
                    <Trash2 size={14} />
                    {deleting === schedule.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
