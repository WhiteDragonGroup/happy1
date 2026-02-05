import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { scheduleAPI } from '../api';
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

export default function EditSchedule() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, refreshData } = useApp();
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<FormState>({
    title: '',
    organizer: '',
    posterImage: null,
    posterPreview: '',
    date: '',
    publicDateTime: '',
    ticketOpenDateTime: '',
    ticketTypes: [],
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

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const scheduleRes = await scheduleAPI.getById(Number(id));
      const schedule = scheduleRes.data;

      // 권한 체크
      if (user?.role !== 'ADMIN' && schedule.managerId !== user?.id) {
        alert('수정 권한이 없습니다');
        navigate(-1);
        return;
      }

      // 폼 데이터 설정
      setForm({
        title: schedule.title || '',
        organizer: schedule.organizer || '',
        posterImage: null,
        posterPreview: schedule.imageUrl || '',
        date: schedule.date?.split('T')[0] || '',
        publicDateTime: schedule.publicDateTime?.slice(0, 16) || '',
        ticketOpenDateTime: schedule.ticketOpenDateTime?.slice(0, 16) || '',
        ticketTypes: schedule.ticketTypes ? schedule.ticketTypes.split(',') : [],
        timeSlots: schedule.timeSlots?.length > 0
          ? schedule.timeSlots.map((slot: any) => ({
              startTime: slot.startTime?.substring(0, 5) || '',
              endTime: slot.endTime?.substring(0, 5) || '',
              teamName: slot.teamName || '',
              description: slot.description || ''
            }))
          : [{ startTime: '', endTime: '', teamName: '', description: '' }],
        advancePrice: schedule.advancePrice?.toString() || '',
        doorPrice: schedule.doorPrice?.toString() || '',
        capacity: schedule.capacity?.toString() || '',
        notice: schedule.description || '',
        location: schedule.venue || '',
      });

      setSwitches({
        advancePrice: schedule.advancePrice !== null && schedule.advancePrice !== undefined,
        doorPrice: schedule.doorPrice !== null && schedule.doorPrice !== undefined,
        notice: !!schedule.description,
        location: !!schedule.venue,
      });

    } catch (error) {
      console.error('Failed to load schedule:', error);
      alert('일정을 불러오는데 실패했습니다');
      navigate(-1);
    }
    setLoading(false);
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
      // 티켓 판매일이 일정 공개일보다 앞서면 안됨
      if (form.ticketOpenDateTime && form.publicDateTime) {
        if (new Date(form.ticketOpenDateTime) < new Date(form.publicDateTime)) {
          alert('티켓 판매 오픈일은 일정 공개일 이후여야 합니다.');
          setIsSubmitting(false);
          return;
        }
      }

      const scheduleData = {
        title: form.title,
        organizer: form.organizer || '',
        date: form.date,
        publicDateTime: form.publicDateTime || null,
        ticketOpenDateTime: form.ticketOpenDateTime || null,
        ticketTypes: form.ticketTypes.length > 0 ? form.ticketTypes.join(',') : null,
        capacity: Number(form.capacity),
        advancePrice: switches.advancePrice && form.advancePrice ? Number(form.advancePrice) : null,
        doorPrice: switches.doorPrice && form.doorPrice ? Number(form.doorPrice) : null,
        venue: switches.location ? form.location : null,
        description: switches.notice ? form.notice : null,
        imageUrl: form.posterPreview || null,
        isPublished: true,
        timeSlots: form.timeSlots
          .filter(slot => slot.startTime && slot.endTime && slot.teamName)
          .map(slot => ({
            startTime: slot.startTime.length === 5 ? slot.startTime + ':00' : slot.startTime,
            endTime: slot.endTime.length === 5 ? slot.endTime + ':00' : slot.endTime,
            teamName: slot.teamName,
            description: slot.description || null,
          })),
      };

      await scheduleAPI.update(Number(id), scheduleData);
      await refreshData();
      alert('일정이 수정되었습니다!');
      navigate('/mypage/manage-schedules');
    } catch (error) {
      console.error('일정 수정 실패:', error);
      alert('일정 수정에 실패했습니다.');
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
          <h1 className="page-title">일정 수정</h1>
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

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">일정 수정</h1>
          <div className={styles.placeholder} />
        </header>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          로딩 중...
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
        <h1 className="page-title">일정 수정</h1>
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

        {/* 일정 공개일시 */}
        <div className={styles.section}>
          <label className={styles.label}>
            일정 공개일시
          </label>
          <input
            type="datetime-local"
            name="publicDateTime"
            value={form.publicDateTime}
            onChange={handleInputChange}
          />
          <p className={styles.hint}>비워두면 즉시 공개됩니다</p>
        </div>

        {/* 티켓 판매 오픈일시 */}
        <div className={styles.section}>
          <label className={styles.label}>
            티켓 판매 오픈일시
          </label>
          <input
            type="datetime-local"
            name="ticketOpenDateTime"
            value={form.ticketOpenDateTime}
            onChange={handleInputChange}
          />
          <p className={styles.hint}>일정 공개일 이후로 설정해주세요</p>
        </div>

        {/* 티켓 권종 */}
        <div className={styles.section}>
          <label className={styles.label}>
            티켓 권종
          </label>
          <div className={styles.ticketTypes}>
            {['A석', 'S석', 'R석', '스탠딩', '무료'].map(type => (
              <label key={type} className={styles.ticketTypeLabel}>
                <input
                  type="checkbox"
                  checked={form.ticketTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setForm(prev => ({ ...prev, ticketTypes: [...prev.ticketTypes, type] }));
                    } else {
                      setForm(prev => ({ ...prev, ticketTypes: prev.ticketTypes.filter(t => t !== type) }));
                    }
                  }}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
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
            {isSubmitting ? '수정 중...' : '일정 수정'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
