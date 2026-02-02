import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ExternalLink, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Team } from '../types';
import styles from './ArtistPopup.module.css';

interface ArtistPopupProps {
  artist: Team | null;
  artistName?: string;
  onClose: () => void;
}

export default function ArtistPopup({ artist, artistName, onClose }: ArtistPopupProps) {
  const navigate = useNavigate();
  const { isLoggedIn, toggleFavorite, isFavorite, teams, schedules } = useApp();

  // 이름으로 아티스트 찾기 (artist가 없을 경우)
  const foundArtist = artist || teams.find(t =>
    t.name.toLowerCase() === artistName?.toLowerCase()
  );

  const isFav = foundArtist ? isFavorite(String(foundArtist.id)) : false;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate('/login');
      onClose();
      return;
    }
    if (foundArtist) {
      toggleFavorite(String(foundArtist.id));
    }
  };

  const handleViewDetail = () => {
    if (foundArtist) {
      navigate(`/team/${foundArtist.id}`);
      onClose();
    }
  };

  // 해당 아티스트의 다가오는 일정 수
  const upcomingSchedules = foundArtist ? schedules.filter(s =>
    !s.isDeleted &&
    (s.team?.id === foundArtist.id || s.teamId === foundArtist.id) &&
    new Date(s.date) >= new Date()
  ).length : 0;

  if (!foundArtist && !artistName) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.popup}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>

          {foundArtist ? (
            <>
              {/* 아티스트 정보 있음 */}
              <div className={styles.header}>
                <div className={styles.imageWrapper}>
                  <img
                    src={foundArtist.imageUrl || 'https://picsum.photos/200/200'}
                    alt={foundArtist.name}
                    className={styles.image}
                  />
                </div>
                <div className={styles.info}>
                  <h3 className={styles.name}>{foundArtist.name}</h3>
                  {foundArtist.genre && (
                    <span className={styles.genre}>{foundArtist.genre}</span>
                  )}
                </div>
                <button
                  className={`${styles.favoriteBtn} ${isFav ? styles.active : ''}`}
                  onClick={handleToggleFavorite}
                >
                  <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              </div>

              {foundArtist.description && (
                <p className={styles.description}>{foundArtist.description}</p>
              )}

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <Calendar size={16} />
                  <span>다가오는 일정 {upcomingSchedules}개</span>
                </div>
              </div>

              <div className={styles.actions}>
                <button className={styles.detailBtn} onClick={handleViewDetail}>
                  <ExternalLink size={16} />
                  상세 페이지
                </button>
              </div>
            </>
          ) : (
            <>
              {/* 아티스트 정보 없음 (이름만 있음) */}
              <div className={styles.header}>
                <div className={styles.imageWrapper}>
                  <div className={styles.placeholderImage}>
                    {artistName?.charAt(0)}
                  </div>
                </div>
                <div className={styles.info}>
                  <h3 className={styles.name}>{artistName}</h3>
                  <span className={styles.unregistered}>미등록 아티스트</span>
                </div>
              </div>
              <p className={styles.noInfo}>
                이 아티스트의 상세 정보가 아직 등록되지 않았습니다.
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
