import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './Favorites.module.css';

export default function Favorites() {
  const { teams, toggleFavorite, isFavorite, getFavoriteTeams } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const favoriteTeams = getFavoriteTeams();

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">찜</h1>
      </header>

      <div className={styles.container}>
        {/* 검색 */}
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="팀 이름 또는 장르로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              className={styles.clearBtn}
              onClick={() => setSearchQuery('')}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* 찜한 팀 목록 */}
        {favoriteTeams.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Heart size={18} fill="var(--neon-pink)" />
              찜한 팀
            </h2>
            <div className={styles.teamGrid}>
              <AnimatePresence>
                {favoriteTeams.map((team) => (
                  <motion.div
                    key={team.id}
                    className={`${styles.teamCard} ${styles.favorited}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <img
                      src={team.profileImage}
                      alt={team.name}
                      className={styles.teamImage}
                    />
                    <div className={styles.teamInfo}>
                      <h3 className={styles.teamName}>{team.name}</h3>
                      <span className={styles.teamGenre}>{team.genre}</span>
                    </div>
                    <button
                      className={`${styles.favBtn} ${styles.active}`}
                      onClick={() => toggleFavorite(team.id)}
                    >
                      <Heart size={20} fill="var(--neon-pink)" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* 전체 팀 목록 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>전체 팀</h2>
          <div className={styles.teamList}>
            {filteredTeams.map((team, idx) => (
              <motion.div
                key={team.id}
                className={`${styles.teamCard} ${isFavorite(team.id) ? styles.favorited : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <img
                  src={team.profileImage}
                  alt={team.name}
                  className={styles.teamImage}
                />
                <div className={styles.teamInfo}>
                  <h3 className={styles.teamName}>{team.name}</h3>
                  <span className={styles.teamGenre}>{team.genre}</span>
                  <p className={styles.teamDesc}>{team.description}</p>
                </div>
                <button
                  className={`${styles.favBtn} ${isFavorite(team.id) ? styles.active : ''}`}
                  onClick={() => toggleFavorite(team.id)}
                >
                  <Heart
                    size={20}
                    fill={isFavorite(team.id) ? 'var(--neon-pink)' : 'none'}
                  />
                </button>
              </motion.div>
            ))}
          </div>

          {filteredTeams.length === 0 && (
            <div className={styles.empty}>
              <p>검색 결과가 없습니다</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}