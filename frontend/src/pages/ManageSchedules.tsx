import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, Edit2, Trash2, Eye, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { scheduleAPI } from '../api';
import styles from './common.module.css';

export default function ManageSchedules() {
  const navigate = useNavigate();
  const { user, schedules, refreshData } = useApp();
  const [deleting, setDeleting] = useState<number | null>(null);

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  if (!isManager) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">일정 관리</h1>
          <div className={styles.placeholder} />
        </header>
        <div className={styles.unauthorized}>
          <p>일정관리자 권한이 필요합니다</p>
          <button className="btn btn-secondary" onClick={() => navigate('/mypage')}>
            마이페이지로
          </button>
        </div>
      </div>
    );
  }

  // 내 일정만 필터 (ADMIN은 전체)
  const mySchedules = user?.role === 'ADMIN'
    ? schedules.filter(s => !s.isDeleted)
    : schedules.filter(s => !s.isDeleted && s.managerId === user?.id);

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
        <h1 className="page-title">일정 관리</h1>
        <button className={styles.backBtn} onClick={() => navigate('/mypage/create-schedule')}>
          <Plus size={24} />
        </button>
      </header>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {mySchedules.length === 0 ? (
          <div className={styles.empty}>
            <Calendar size={48} className={styles.emptyIcon} />
            <p>등록한 일정이 없습니다</p>
            <button className="btn btn-primary" onClick={() => navigate('/mypage/create-schedule')}>
              일정 등록하기
            </button>
          </div>
        ) : (
          <div className={styles.cardList}>
            {mySchedules.map((schedule, idx) => (
              <motion.div
                key={schedule.id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <span className={styles.cardTitle}>{schedule.title}</span>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--neon-cyan)', marginTop: 4 }}>
                      {schedule.team?.name}
                    </p>
                  </div>
                  <span className={`${styles.badge} ${schedule.isPublished ? styles.badgeApproved : styles.badgePending}`}>
                    {schedule.isPublished ? '공개' : '비공개'}
                  </span>
                </div>
                <p className={styles.cardMeta}>
                  {new Date(schedule.date).toLocaleDateString('ko-KR')} | {schedule.venue}
                </p>
                <div className={styles.cardActions}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/schedule/${schedule.id}`)}
                  >
                    <Eye size={14} />
                    상세
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/manage-reservations/${schedule.id}`)}
                  >
                    <Users size={14} />
                    예약자
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/mypage/edit-schedule/${schedule.id}`)}
                  >
                    <Edit2 size={14} />
                    수정
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
