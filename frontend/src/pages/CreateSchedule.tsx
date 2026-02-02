import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { scheduleAPI, teamAPI, fileAPI } from '../api';
import styles from './CreateSchedule.module.css';

interface Artist {
  id: number;
  name: string;
  genre?: string;
}

interface TimeSlotInput {
  startTime: string;
  endTime: string;
  teamName: string;
  description: string;
}

interface FormState {
  title: string;
  organizer: string;
  posterImage: File | null;
  posterPreview: string;
  date: string;
  publicDate: string;
  timeSlots: TimeSlotInput[];
  advancePrice: string;
  doorPrice: string;
  capacity: string;
  notice: string;
  location: string;
}

interface SwitchState {
  advancePrice: boolean;
  doorPrice: boolean;
  notice: boolean;
  location: boolean;
}

export default function CreateSchedule() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [artists, setArtists] = useState<Artist[]>([]);

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
  };

  const [form, setForm] = useState<FormState>({
    title: '',
    organizer: '',
    posterImage: null,
    posterPreview: '',
    date: '',
    publicDate: '',
    timeSlots: [{ startTime: '', endTime: '', teamName: '', description: '' }],
    advancePrice: '',
    doorPrice: '',
    capacity: '',
    notice: '',
    location: '',
  });

  const [switches, setSwitches] = useState<SwitchState>({
    advancePrice: true,
    doorPrice: true,
    notice: true,
    location: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(prev => ({
        ...prev,
        posterImage: file,
        posterPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleTimeSlotChange = (index: number, field: keyof TimeSlotInput, value: string) => {
    setForm(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const addTimeSlot = () => {
    const lastSlot = form.timeSlots[form.timeSlots.length - 1];
    const newStartTime = lastSlot?.endTime || '';

    setForm(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, {
        startTime: newStartTime,
        endTime: '',
        teamName: '',
        description: ''
      }],
    }));
  };

  const removeTimeSlot = (index: number) => {
    if (form.timeSlots.length > 1) {
      setForm(prev => ({
        ...prev,
        timeSlots: prev.timeSlots.filter((_, i) => i !== index),
      }));
    }
  };

  const toggleSwitch = (key: keyof SwitchState) => {
    setSwitches(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 이미지 업로드
      let imageUrl = null;
      if (form.posterImage) {
        const uploadRes = await fileAPI.upload(form.posterImage);
        imageUrl = uploadRes.data.url;
      }

      const scheduleData = {
        title: form.title,
        organizer: form.organizer,
        date: form.date,
        publicDate: form.publicDate || form.date,
        capacity: Number(form.capacity),
        advancePrice: switches.advancePrice && form.advancePrice ? Number(form.advancePrice) : null,
        doorPrice: switches.doorPrice && form.doorPrice ? Number(form.doorPrice) : null,
        venue: switches.location ? form.location : null,
        description: switches.notice ? form.notice : null,
        imageUrl: imageUrl,
        isPublished: true,
        timeSlots: form.timeSlots
          .filter(slot => slot.startTime && slot.endTime && slot.teamName)
          .map(slot => ({
            startTime: slot.startTime + ':00',
            endTime: slot.endTime + ':00',
            teamName: slot.teamName,
            description: slot.description || null,
          })),
      };

      await scheduleAPI.create(scheduleData);
      alert('일정이 등록되었습니다!');
      navigate('/mypage/manage-schedules');
    } catch (error) {
      console.error('일정 등록 실패:', error);
      alert('일정 등록에 실패했습니다.');
    }

    setIsSubmitting(false);
  };

  if (user?.role !== 'MANAGER' && user?.role !== 'ADMIN') {
    return (
      <div className="page">
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">일정 등록</h1>
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">일정 등록</h1>
        <div className={styles.placeholder} />
      </header>

      <motion.form
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onSubmit={handleSubmit}
      >
        {/* 포스터 이미지 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.label}>
              포스터 이미지
            </label>
          </div>
          <div
            className={styles.imageUpload}
            onClick={() => document.getElementById('posterInput')?.click()}
          >
            {form.posterPreview ? (
              <img src={form.posterPreview} alt="포스터 미리보기" className={styles.posterPreview} />
            ) : (
              <div className={styles.uploadPlaceholder}>
                <ImageIcon size={32} />
                <span>이미지 업로드</span>
                <span className={styles.uploadHint}>권장: 3:4 비율</span>
              </div>
            )}
            <input
              id="posterInput"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={styles.hiddenInput}
            />
          </div>
        </div>

        {/* 제목 */}
        <div className={styles.section}>
          <label className={styles.label}>
            공연 제목 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleInputChange}
            placeholder="예: LIVE in SETi Vol.73"
            required
          />
        </div>

        {/* 주최자 */}
        <div className={styles.section}>
          <label className={styles.label}>주최</label>
          <input
            type="text"
            name="organizer"
            value={form.organizer}
            onChange={handleInputChange}
            placeholder="주최자를 입력하세요"
          />
        </div>

        {/* 공연 날짜 */}
        <div className={styles.section}>
          <label className={styles.label}>
            공연 날짜 <span className={styles.required}>*</span>
          </label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleInputChange}
            min="2020-01-01"
            max="2099-12-31"
            required
          />
        </div>

        {/* 공개일 */}
        <div className={styles.section}>
          <label className={styles.label}>
            일정 공개일
          </label>
          <input
            type="date"
            name="publicDate"
            value={form.publicDate}
            onChange={handleInputChange}
            min="2020-01-01"
            max="2099-12-31"
          />
          <p className={styles.hint}>비워두면 즉시 공개됩니다</p>
        </div>

        {/* 타임테이블 */}
        <div className={styles.section}>
          <label className={styles.label}>
            타임테이블 <span className={styles.required}>*</span>
          </label>
          <div className={styles.timeSlots}>
            {form.timeSlots.map((slot, index) => (
              <div key={index} className={styles.timeSlotCard}>
                <div className={styles.timeSlotHeader}>
                  <span className={styles.slotNumber}>#{index + 1}</span>
                  {form.timeSlots.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeTimeSlot(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className={styles.timeRow}>
                  <div className={styles.timeField}>
                    <label>시작</label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                      required
                    />
                  </div>
                  <span className={styles.timeSeparator}>~</span>
                  <div className={styles.timeField}>
                    <label>종료</label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className={styles.artistSelect}>
                  <select
                    value={artists.some(a => a.name === slot.teamName) ? slot.teamName : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        handleTimeSlotChange(index, 'teamName', '');
                      } else {
                        handleTimeSlotChange(index, 'teamName', e.target.value);
                      }
                    }}
                    className={styles.artistDropdown}
                  >
                    <option value="">아티스트 선택</option>
                    {artists.map(artist => (
                      <option key={artist.id} value={artist.name}>
                        {artist.name} {artist.genre && `(${artist.genre})`}
                      </option>
                    ))}
                    <option value="__custom__">직접 입력</option>
                  </select>
                  {(!artists.some(a => a.name === slot.teamName) || slot.teamName === '') && (
                    <input
                      type="text"
                      value={slot.teamName}
                      onChange={(e) => handleTimeSlotChange(index, 'teamName', e.target.value)}
                      placeholder="아티스트 이름 입력"
                      className={styles.teamNameInput}
                    />
                  )}
                </div>
                <input
                  type="text"
                  value={slot.description}
                  onChange={(e) => handleTimeSlotChange(index, 'description', e.target.value)}
                  placeholder="설명 (선택)"
                  className={styles.descInput}
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.addSlotBtn}
              onClick={addTimeSlot}
            >
              <Plus size={18} />
              팀 추가
            </button>
            <p className={styles.hint}>팀 추가 시 이전 팀 종료 시간이 자동으로 시작 시간에 입력됩니다</p>
          </div>
        </div>

        {/* 정원 */}
        <div className={styles.section}>
          <label className={styles.label}>
            정원 <span className={styles.required}>*</span>
          </label>
          <input
            type="number"
            name="capacity"
            value={form.capacity}
            onChange={handleInputChange}
            placeholder="정원을 입력하세요"
            min="1"
            required
          />
        </div>

        {/* 예약 발권 가격 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.label}>예약 발권 가격</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={switches.advancePrice}
                onChange={() => toggleSwitch('advancePrice')}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
          {switches.advancePrice ? (
            <div className={styles.priceInput}>
              <input
                type="number"
                name="advancePrice"
                value={form.advancePrice}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
              <span className={styles.priceUnit}>원</span>
            </div>
          ) : (
            <div className={styles.freeLabel}>예약 발권 없음</div>
          )}
        </div>

        {/* 현장 발권 가격 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.label}>현장 발권 가격</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={switches.doorPrice}
                onChange={() => toggleSwitch('doorPrice')}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
          {switches.doorPrice ? (
            <div className={styles.priceInput}>
              <input
                type="number"
                name="doorPrice"
                value={form.doorPrice}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
              <span className={styles.priceUnit}>원</span>
            </div>
          ) : (
            <div className={styles.freeLabel}>현장 발권 없음</div>
          )}
        </div>

        {/* 장소 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.label}>장소</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={switches.location}
                onChange={() => toggleSwitch('location')}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
          {switches.location && (
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleInputChange}
              placeholder="공연 장소를 입력하세요"
            />
          )}
        </div>

        {/* 안내사항 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.label}>안내사항</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={switches.notice}
                onChange={() => toggleSwitch('notice')}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
          {switches.notice && (
            <textarea
              name="notice"
              value={form.notice}
              onChange={handleInputChange}
              placeholder="공연 관련 안내사항을 입력하세요"
              rows={4}
            />
          )}
        </div>

        {/* 제출 버튼 */}
        <div className={styles.submitSection}>
          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? '등록 중...' : '일정 등록'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
