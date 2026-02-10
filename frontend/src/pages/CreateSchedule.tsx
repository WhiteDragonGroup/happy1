import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Copy,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { scheduleAPI } from '../api';
import type { Schedule } from '../types';
import styles from './CreateSchedule.module.css';

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
  publicDateTime: string;
  ticketOpenDateTime: string;
  ticketTypes: string[];
  timeSlots: TimeSlotInput[];
  advancePrice: string;
  doorPrice: string;
  priceA: string;
  priceS: string;
  priceR: string;
  openTime: string;
  capacity: string;
  notice: string;
  location: string;
  entryNumberType: string;
}

interface SwitchState {
  notice: boolean;
  location: boolean;
}

const DRAFT_STORAGE_KEY = 'schedule-draft';

const DEFAULT_FORM: FormState = {
  title: '',
  organizer: '',
  posterImage: null,
  posterPreview: '',
  date: '',
  publicDateTime: '',
  ticketOpenDateTime: '',
  ticketTypes: [],
  timeSlots: [{ startTime: '', endTime: '', teamName: '', description: '' }],
  openTime: '',
  advancePrice: '',
  doorPrice: '',
  priceA: '',
  priceS: '',
  priceR: '',
  capacity: '',
  notice: '',
  location: '',
  entryNumberType: 'NONE',
};

const DEFAULT_SWITCHES: SwitchState = {
  notice: true,
  location: true,
};

export default function CreateSchedule() {
  const navigate = useNavigate();
  const { user, schedules, refreshData } = useApp();

  const [form, setForm] = useState<FormState>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) {
          return { ...DEFAULT_FORM, ...parsed.form, posterImage: null, posterPreview: '' };
        }
      }
    } catch { /* ignore */ }
    return DEFAULT_FORM;
  });

  const [switches, setSwitches] = useState<SwitchState>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.switches) {
          return { ...DEFAULT_SWITCHES, ...parsed.switches };
        }
      }
    } catch { /* ignore */ }
    return DEFAULT_SWITCHES;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  // 임시저장 복원 감지
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form && parsed.form.title) {
          setDraftRestored(true);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // form/switches 변경 시 자동 임시저장
  useEffect(() => {
    const { posterImage: _pi, posterPreview: _pp, ...savableForm } = form;
    const draft = { form: savableForm, switches };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [form, switches]);

  // 내 일정 필터
  const mySchedules = schedules
    .filter((s: Schedule) => !s.isDeleted && s.managerId === user?.id)
    .sort((a: Schedule, b: Schedule) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleClearDraft = () => {
    setForm(DEFAULT_FORM);
    setSwitches(DEFAULT_SWITCHES);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraftRestored(false);
  };

  const loadScheduleIntoForm = (schedule: Schedule) => {
    setForm({
      ...DEFAULT_FORM,
      title: schedule.title || '',
      organizer: schedule.organizer || '',
      date: '', // 날짜는 복사하지 않음
      publicDateTime: '',
      ticketOpenDateTime: '',
      ticketTypes: schedule.ticketTypes ? schedule.ticketTypes.split(',') : [],
      timeSlots: schedule.timeSlots && schedule.timeSlots.length > 0
        ? schedule.timeSlots.map(ts => ({
            startTime: ts.startTime ? ts.startTime.slice(0, 5) : '',
            endTime: ts.endTime ? ts.endTime.slice(0, 5) : '',
            teamName: ts.teamName || '',
            description: ts.description || '',
          }))
        : [{ startTime: '', endTime: '', teamName: '', description: '' }],
      openTime: schedule.openTime ? schedule.openTime.slice(0, 5) : '',
      advancePrice: schedule.advancePrice != null ? String(schedule.advancePrice) : '',
      doorPrice: schedule.doorPrice != null ? String(schedule.doorPrice) : '',
      priceA: schedule.priceA != null ? String(schedule.priceA) : '',
      priceS: schedule.priceS != null ? String(schedule.priceS) : '',
      priceR: schedule.priceR != null ? String(schedule.priceR) : '',
      capacity: schedule.capacity ? String(schedule.capacity) : '',
      notice: schedule.description || '',
      location: schedule.venue || '',
      entryNumberType: schedule.entryNumberType || 'NONE',
    });

    setSwitches({
      notice: !!schedule.description,
      location: !!schedule.venue,
    });
  };

  const handleSelectSchedule = async (id: number) => {
    try {
      const res = await scheduleAPI.getById(id);
      loadScheduleIntoForm(res.data);
      setShowCopyModal(false);
      setDraftRestored(false);
    } catch (error) {
      console.error('일정 불러오기 실패:', error);
      alert('일정을 불러오는데 실패했습니다.');
    }
  };

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
      // 필수값 검증
      if (!form.openTime) {
        alert('입장시간을 입력해주세요.');
        setIsSubmitting(false);
        return;
      }
      if (!form.publicDateTime) {
        alert('일정 공개일시를 입력해주세요.');
        setIsSubmitting(false);
        return;
      }
      if (!form.ticketOpenDateTime) {
        alert('티켓 판매 오픈일시를 입력해주세요.');
        setIsSubmitting(false);
        return;
      }

      // 티켓 판매일이 일정 공개일보다 앞서면 안됨
      if (new Date(form.ticketOpenDateTime) < new Date(form.publicDateTime)) {
        alert('티켓 판매 오픈일은 일정 공개일 이후여야 합니다.');
        setIsSubmitting(false);
        return;
      }

      const scheduleData = {
        title: form.title,
        organizer: form.organizer || '',
        date: form.date,
        publicDateTime: form.publicDateTime,
        ticketOpenDateTime: form.ticketOpenDateTime,
        ticketTypes: form.ticketTypes.length > 0 ? form.ticketTypes.join(',') : null,
        openTime: form.openTime + ':00',
        capacity: Number(form.capacity),
        advancePrice: null,
        doorPrice: null,
        priceA: form.ticketTypes.includes('A석') && form.priceA ? Number(form.priceA) : null,
        priceS: form.ticketTypes.includes('S석') && form.priceS ? Number(form.priceS) : null,
        priceR: form.ticketTypes.includes('R석') && form.priceR ? Number(form.priceR) : null,
        venue: switches.location ? form.location : null,
        description: switches.notice ? form.notice : null,
        entryNumberType: form.entryNumberType || 'NONE',
        imageUrl: null,
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
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      await refreshData();
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
        <button
          type="button"
          className={styles.copyBtn}
          onClick={() => setShowCopyModal(true)}
          title="이전 일정 불러오기"
        >
          <Copy size={20} />
        </button>
      </header>

      <motion.form
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onSubmit={handleSubmit}
      >
        {/* 임시저장 복원 배너 */}
        <AnimatePresence>
          {draftRestored && (
            <motion.div
              className={styles.draftBanner}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <span>임시저장된 내용을 불러왔습니다</span>
              <button
                type="button"
                className={styles.draftClearBtn}
                onClick={handleClearDraft}
              >
                새로 작성
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
                <span>이미지 업로드 (준비 중)</span>
                <span className={styles.uploadHint}>스토리지 준비 후 지원 예정</span>
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

        {/* 입장시간 */}
        <div className={styles.section}>
          <label className={styles.label}>
            입장시간 (오픈 시간) <span className={styles.required}>*</span>
          </label>
          <input
            type="time"
            name="openTime"
            value={form.openTime}
            onChange={handleInputChange}
            required
          />
          <p className={styles.hint}>관객 입장 시작 시간</p>
        </div>

        {/* 일정 공개일시 */}
        <div className={styles.section}>
          <label className={styles.label}>
            일정 공개일시 <span className={styles.required}>*</span>
          </label>
          <input
            type="datetime-local"
            name="publicDateTime"
            value={form.publicDateTime}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* 티켓 판매 오픈일시 */}
        <div className={styles.section}>
          <label className={styles.label}>
            티켓 판매 오픈일시 <span className={styles.required}>*</span>
          </label>
          <input
            type="datetime-local"
            name="ticketOpenDateTime"
            value={form.ticketOpenDateTime}
            onChange={handleInputChange}
            required
          />
          <p className={styles.hint}>일정 공개일 이후로 설정해주세요</p>
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

        {/* 권종 선택 및 가격 설정 */}
        <div className={styles.section}>
          <label className={styles.label}>권종 선택 및 가격</label>
          <div className={styles.ticketTypesContainer}>
            {['A석', 'S석', 'R석', '무료'].map(type => {
              const isSelected = form.ticketTypes.includes(type);
              const priceKey = type === 'A석' ? 'priceA' : type === 'S석' ? 'priceS' : type === 'R석' ? 'priceR' : null;
              return (
                <div key={type} className={styles.ticketTypeRow}>
                  <button
                    type="button"
                    className={`${styles.ticketTypeBtn} ${isSelected ? styles.active : ''}`}
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        ticketTypes: prev.ticketTypes.includes(type)
                          ? prev.ticketTypes.filter(t => t !== type)
                          : [...prev.ticketTypes, type]
                      }));
                    }}
                  >
                    {type}
                  </button>
                  {isSelected && priceKey && (
                    <div className={styles.ticketPriceInput}>
                      <input
                        type="number"
                        value={form[priceKey]}
                        onChange={(e) => setForm(prev => ({ ...prev, [priceKey]: e.target.value }))}
                        placeholder="가격"
                        min="0"
                      />
                      <span>원</span>
                    </div>
                  )}
                  {isSelected && type === '무료' && (
                    <span className={styles.freeTag}>무료</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className={styles.hint}>선택한 권종별로 가격을 설정하세요</p>
        </div>

        {/* 입장순 타입 */}
        <div className={styles.section}>
          <label className={styles.label}>입장번호 방식</label>
          <div className={styles.entryTypeGrid}>
            {[
              { value: 'NONE', label: '입장순 없음' },
              { value: 'RESERVATION_ORDER', label: '예매순' },
              { value: 'RANDOM', label: '랜덤순' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.entryTypeBtn} ${form.entryNumberType === opt.value ? styles.active : ''}`}
                onClick={() => setForm(prev => ({ ...prev, entryNumberType: opt.value }))}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>티켓 발권 시 입장번호가 부여되는 방식</p>
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
                  <input
                    type="text"
                    value={slot.teamName}
                    onChange={(e) => handleTimeSlotChange(index, 'teamName', e.target.value)}
                    placeholder="아티스트/팀 이름 입력"
                    className={styles.teamNameInput}
                    required
                  />
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

      {/* 이전 일정 복사 모달 */}
      <AnimatePresence>
        {showCopyModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCopyModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>이전 일정 불러오기</h2>
                <button onClick={() => setShowCopyModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                {mySchedules.length === 0 ? (
                  <p className={styles.emptyMessage}>등록한 일정이 없습니다</p>
                ) : (
                  <ul className={styles.scheduleList}>
                    {mySchedules.map((s: Schedule) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className={styles.scheduleItem}
                          onClick={() => handleSelectSchedule(s.id)}
                        >
                          <span className={styles.scheduleTitle}>{s.title}</span>
                          <span className={styles.scheduleDate}>{s.date}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
