import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Edit2, Music, X, Check, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { teamAPI, imageAPI } from '../api';
import styles from './common.module.css';

interface Artist {
  id: number;
  name: string;
  description?: string;
  genre?: string;
  imageUrl?: string;
  xUrl?: string;
}

export default function AdminArtists() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [form, setForm] = useState({ name: '', koreanName: '', description: '', genre: '', xUrl: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      const res = await teamAPI.getAll();
      setArtists(res.data);
    } catch (error) {
      console.error('Failed to load artists:', error);
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
          <h1 className="page-title">아티스트 관리</h1>
          <div className={styles.placeholder} />
        </header>
        <div className={styles.unauthorized}>
          <Music size={48} />
          <p>관리자 권한이 필요합니다</p>
        </div>
      </div>
    );
  }

  const openAddModal = () => {
    setEditingArtist(null);
    setForm({ name: '', koreanName: '', description: '', genre: '', xUrl: '' });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (artist: Artist) => {
    setEditingArtist(artist);
    setForm({
      name: artist.name,
      koreanName: (artist as any).koreanName || '',
      description: artist.description || '',
      genre: artist.genre || '',
      xUrl: artist.xUrl || ''
    });
    setImageFile(null);
    setImagePreview(artist.imageUrl || null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('그룹명을 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = editingArtist?.imageUrl || undefined;
      if (imageFile) {
        const uploadRes = await imageAPI.upload(imageFile);
        imageUrl = uploadRes.data.url;
      }
      const payload = { ...form, imageUrl };

      if (editingArtist) {
        // 수정
        await teamAPI.update(editingArtist.id, payload);
        setArtists(artists.map(a =>
          a.id === editingArtist.id ? { ...a, ...payload } : a
        ));
      } else {
        // 추가
        const res = await teamAPI.create(payload);
        setArtists([...artists, res.data]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save artist:', error);
      alert('저장에 실패했습니다');
    }
    setSaving(false);
  };

  const handleDelete = async (artist: Artist) => {
    if (!confirm(`"${artist.name}" 아티스트를 삭제하시겠습니까?`)) return;

    try {
      await teamAPI.delete(artist.id);
      setArtists(artists.filter(a => a.id !== artist.id));
    } catch (error) {
      console.error('Failed to delete artist:', error);
      alert('삭제에 실패했습니다');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">아티스트 관리</h1>
        <button className={styles.headerBtn} onClick={openAddModal}>
          <Plus size={24} />
        </button>
      </header>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          총 {artists.length}개 아티스트
        </p>

        {loading ? (
          <div className={styles.empty}>
            <p>로딩 중...</p>
          </div>
        ) : artists.length === 0 ? (
          <div className={styles.empty}>
            <Music size={48} className={styles.emptyIcon} />
            <p>등록된 아티스트가 없습니다</p>
            <button className="btn btn-primary" onClick={openAddModal}>
              아티스트 추가
            </button>
          </div>
        ) : (
          <div className={styles.cardList}>
            {artists.map((artist, idx) => (
              <motion.div
                key={artist.id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <div className={styles.cardHeader} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {artist.imageUrl && (
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
                    />
                  )}
                  <div>
                    <span className={styles.cardTitle}>{artist.name}</span>
                    {artist.genre && (
                      <span className={styles.badge} style={{ marginLeft: 8 }}>
                        {artist.genre}
                      </span>
                    )}
                  </div>
                </div>
                {artist.description && (
                  <p className={styles.cardMeta}>{artist.description}</p>
                )}
                <div className={styles.cardActions}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openEditModal(artist)}
                  >
                    <Edit2 size={14} />
                    수정
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete(artist)}
                    style={{ color: 'var(--neon-pink)' }}
                  >
                    <Trash2 size={14} />
                    삭제
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 추가/수정 모달 */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>{editingArtist ? '아티스트 수정' : '아티스트 추가'}</h2>
              <button onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>아티스트 이미지</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{
                    width: 72, height: 72, borderRadius: '50%', border: '2px dashed var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    overflow: 'hidden', background: 'var(--bg-secondary)', flexShrink: 0
                  }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Camera size={24} style={{ color: 'var(--text-muted)' }} />
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {imageFile ? imageFile.name : '클릭하여 이미지 선택'}
                  </span>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>그룹명 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="아티스트/팀 이름"
                  autoFocus
                />
              </div>
              <div className={styles.formGroup}>
                <label>한글명</label>
                <input
                  type="text"
                  value={form.koreanName}
                  onChange={e => setForm({ ...form, koreanName: e.target.value })}
                  placeholder="한글 검색용 이름 (선택)"
                />
              </div>
              <div className={styles.formGroup}>
                <label>멤버</label>
                <input
                  type="text"
                  value={form.genre}
                  onChange={e => setForm({ ...form, genre: e.target.value })}
                  placeholder="예: 홍길동, 김철수, 이영희"
                />
              </div>
              <div className={styles.formGroup}>
                <label>X(Twitter) 링크</label>
                <input
                  type="text"
                  value={form.xUrl}
                  onChange={e => setForm({ ...form, xUrl: e.target.value })}
                  placeholder="https://x.com/username"
                />
              </div>
              <div className={styles.formGroup}>
                <label>설명</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="간단한 설명 (선택)"
                  rows={3}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                <Check size={18} />
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
