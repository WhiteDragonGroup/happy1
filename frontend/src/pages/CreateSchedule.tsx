import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './CreateSchedule.module.css';

interface TimeSlotInput {
  time: string;
  description: string;
}

interface FormState {
  title: string;
  teamId: string;
  posterImage: File | null;
  posterPreview: string;
  date: string;
  publicDate: string;
  timeSlots: TimeSlotInput[];
  price: string;
  capacity: string;
  notice: string;
  location: string;
}

interface SwitchState {
  price: boolean;
  notice: boolean;
  location: boolean;
}

export default function CreateSchedule() {
  const navigate = useNavigate();
  const { teams, user } = useApp();

  const [form, setForm] = useState<FormState>({
    title: '',
    teamId: '',
    posterImage: null,
    posterPreview: '',
    date: '',
    publicDate: '',
    timeSlots: [{ time: '', description: '' }],
    price: '',
    capacity: '',
    notice: '',
    location: '',
  });

  const [switches, setSwitches] = useState<SwitchState>({
    price: true,
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
    setForm(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { time: '', description: '' }],
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

    // TODO: 실제 API 호출
    console.log('등록할 일정:', {
      ...form,
      price: switches.price ? Number(form.price) : undefined,
      notice: switches.notice ? form.notice : undefined,
      location: switches.location ? form.location : undefined,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/mypage/manage-schedules');
    }, 1000);
  };

  if (user?.role !== 'manager' && user?.role !== 'admin') {
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
              포스터 이미지 <span className={styles.required}>*</span>
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
            placeholder="공연 제목을 입력하세요"
            required
          />
        </div>

        {/* 팀 선택 */}
        <div className={styles.section}>
          <label className={styles.label}>
            팀 선택 <span className={styles.required}>*</span>
          </label>
          <select
            name="teamId"
            value={form.teamId}
            onChange={handleInputChange}
            required
          >
            <option value="">팀을 선택하세요</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
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
            required
          />
        </div>

        {/* 공개일 */}
        <div className={styles.section}>
          <label className={styles.label}>
            일정 공개일 <span className={styles.required}>*</span>
          </label>
          <input
            type="date"
            name="publicDate"
            value={form.publicDate}
            onChange={handleInputChange}
            required
          />
          <p className={styles.hint}>이 날짜부터 회원들에게 일정이 표시됩니다</p>
        </div>

        {/* 타임테이블 */}
        <div className={styles.section}>
          <label className={styles.label}>
            타임테이블 <span className={styles.required}>*</span>
          </label>
          <div className={styles.timeSlots}>
            {form.timeSlots.map((slot, index) => (
              <div key={index} className={styles.timeSlotRow}>
                <input
                  type="time"
                  value={slot.time}
                  onChange={(e) => handleTimeSlotChange(index, 'time', e.target.value)}
                  placeholder="시간"
                  required
                  className={styles.timeInput}
                />
                <input
                  type="text"
                  value={slot.description}
                  onChange={(e) => handleTimeSlotChange(index, 'description', e.target.value)}
                  placeholder="설명 (선택)"
                  className={styles.descInput}
                />
                {form.timeSlots.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeTimeSlot(index)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className={styles.addSlotBtn}
              onClick={addTimeSlot}
            >
              <Plus size={18} />
              시간 추가
            </button>
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

        {/* 가격 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.label}>가격</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={switches.price}
                onChange={() => toggleSwitch('price')}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
          {switches.price ? (
            <div className={styles.priceInput}>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
              <span className={styles.priceUnit}>원</span>
            </div>
          ) : (
            <div className={styles.freeLabel}>무료 공연으로 표시됩니다</div>
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
