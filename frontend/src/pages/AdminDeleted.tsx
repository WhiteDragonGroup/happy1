import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Shield, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './common.module.css';

export default function AdminDeleted() {
  const navigate = useNavigate();
  const { user, schedules, refreshData } = useApp();
  const [restoring, setRestoring] = useState<number | null>(null);

  if (user?.role !== 'ADMIN') {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">삭제된 일정</h1>
          <div className={styles.placeholder} />
        </header>
        <div className={styles.unauthorized}>
          <Shield size={48} />
          <p>관리자 권한이 필요합니다</p>
        </div>
      </div>
    );
  }

  // 삭제된 일정만 필터
  const deletedSchedules = schedules.filter(s => s.isDeleted);

  const handleRestore = async (id: number) => {
    if (!confirm('이 일정을 복구하시겠습니까?')) return;
    setRestoring(id);
    try {
      // TODO: 복구 API 호출
      await new Promise(resolve => setTimeout(resolve, 500));
      await refreshData();
      alert('복구되었습니다');
    } catch (error) {
      alert('복구에 실패했습니다');
    }
    setRestoring(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">삭제된 일정</h1>
        <div className={styles.placeholder} />
      </header>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          삭제된 일정은 30일 후 영구 삭제됩니다
        </p>

        {deletedSchedules.length === 0 ? (
          <div className={styles.empty}>
            <Trash2 size={48} className={styles.emptyIcon} />
            <p>삭제된 일정이 없습니다</p>
          </div>
        ) : (
          <div className={styles.cardList}>
            {deletedSchedules.map((schedule, idx) => (
              <motion.div
                key={schedule.id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{ opacity: 0.7 }}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <span className={styles.cardTitle} style={{ textDecoration: 'line-through' }}>
                      {schedule.title}
                    </span>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {schedule.team?.name}
                    </p>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeRejected}`}>
                    삭제됨
                  </span>
                </div>
                <p className={styles.cardMeta}>
                  {new Date(schedule.date).toLocaleDateString('ko-KR')} | {schedule.venue || '장소 미정'}
                </p>
                <div className={styles.cardActions}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleRestore(schedule.id)}
                    disabled={restoring === schedule.id}
                  >
                    <RotateCcw size={14} />
                    {restoring === schedule.id ? '복구 중...' : '복구'}
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
