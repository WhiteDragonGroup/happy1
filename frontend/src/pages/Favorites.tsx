import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './Favorites.module.css';

const XIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Favorites() {
  const { teams, toggleFavorite, isFavorite, getFavoriteTeams, getFavoriteColor, updateFavoriteColor } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const favoriteTeams = getFavoriteTeams();

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page">
      <header className={`page-header ${styles.header}`}>
        <h1 className={styles.pageTitle}>ARTISTS</h1>
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

        {/* 찜한 팀 목록 - 항상 표시 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Heart size={18} fill="var(--neon-pink)" />
            찜한 팀
          </h2>
          {favoriteTeams.length > 0 ? (
            <div className={styles.teamGrid}>
              <AnimatePresence>
                {favoriteTeams.map((team) => {
                  const teamColor = getFavoriteColor(String(team.id));
                  return (
                    <motion.div
                      key={team.id}
                      className={`${styles.teamCard} ${styles.favorited}`}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      style={teamColor ? {
                        borderColor: teamColor,
                        boxShadow: `0 0 20px ${teamColor}33`
                      } : undefined}
                    >
                      <img
                        src={team.imageUrl || 'https://picsum.photos/100/100'}
                        alt={team.name}
                        className={styles.teamImage}
                      />
                      <div className={styles.teamInfo}>
                        <h3 className={styles.teamName}>{team.name}</h3>
                        <span className={styles.teamGenre}>{team.genre}</span>
                      </div>
                      {/* 컬러 선택 - 왼쪽 하단 */}
                      <label className={styles.colorBtnWrap}>
                        <input
                          type="color"
                          value={teamColor || '#ff1a5c'}
                          onChange={(e) => {
                            updateFavoriteColor(String(team.id), e.target.value);
                          }}
                          className={styles.colorInput}
                        />
                        <span
                          className={styles.colorBtn}
                          style={teamColor ? {
                            background: teamColor,
                            borderColor: teamColor
                          } : undefined}
                        />
                      </label>
                      <div className={styles.cardActions}>
                        {/* X 링크 */}
                        {team.xUrl && (
                          <a
                            href={team.xUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.xLink}
                            onClick={e => e.stopPropagation()}
                          >
                            <XIcon size={16} />
                          </a>
                        )}
                        {/* 하트 */}
                        <button
                          className={`${styles.favBtn} ${styles.active}`}
                          onClick={() => toggleFavorite(String(team.id))}
                        >
                          <Heart size={20} fill="var(--neon-pink)" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className={styles.emptyFavorites}>
              <Heart size={32} color="var(--text-muted)" />
              <p>마음에 드는 팀을 찜해두세요</p>
              <span>아래 목록에서 하트를 눌러 추가할 수 있어요</span>
            </div>
          )}
        </section>

        {/* 전체 팀 목록 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>전체 팀</h2>
          <div className={styles.teamList}>
            {filteredTeams.map((team, idx) => (
              <motion.div
                key={team.id}
                className={`${styles.teamCard} ${isFavorite(String(team.id)) ? styles.favorited : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <img
                  src={team.imageUrl || 'https://picsum.photos/100/100'}
                  alt={team.name}
                  className={styles.teamImage}
                />
                <div className={styles.teamInfo}>
                  <h3 className={styles.teamName}>{team.name}</h3>
                  <span className={styles.teamGenre}>{team.genre}</span>
                  <p className={styles.teamDesc}>{team.description}</p>
                </div>
                <div className={styles.cardActions}>
                  {team.xUrl && (
                    <a
                      href={team.xUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.xLink}
                      onClick={e => e.stopPropagation()}
                    >
                      <XIcon size={16} />
                    </a>
                  )}
                  <button
                    className={`${styles.favBtn} ${isFavorite(String(team.id)) ? styles.active : ''}`}
                    onClick={() => toggleFavorite(String(team.id))}
                  >
                    <Heart
                      size={20}
                      fill={isFavorite(String(team.id)) ? 'var(--neon-pink)' : 'none'}
                    />
                  </button>
                </div>
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
