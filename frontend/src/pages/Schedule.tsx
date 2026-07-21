import React, { useEffect, useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { exportToExcel } from '../utils/exportUtils';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';

type ViewMode = 'all' | 'teacher' | 'class';

const DEFAULT_MAX_LESSONS_PER_DAY = 8;

const Schedule = () => {
  const confirm = useConfirm();
  const { isAdmin } = useAuth();

  const [schedule, setSchedule] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [generateTeacherId, setGenerateTeacherId] = useState<string>('');

  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [viewId, setViewId] = useState<string>('');

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const res = await api.get('/schedules/week?weekNumber=1');
      setSchedule(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Не вдалося завантажити розклад');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/classes'),
      ]);
      setTeachers(tRes.data);
      setClasses(cRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const generateSchedule = async () => {
    const ok = await confirm({
      title: 'Автогенерація розкладу',
      message: generateTeacherId
        ? 'Згенерувати розклад тільки для обраного вчителя? Це замінить лише його поточні уроки.'
        : 'Згенерувати новий розклад для всієї школи? Це замінить весь поточний розклад.',
      confirmText: 'Генерувати',
      danger: true,
    });
    if (!ok) return;

    try {
      const res = await api.post('/schedules/generate', {
        weekNumber: 1,
        teacherId: generateTeacherId ? Number(generateTeacherId) : undefined,
      });

      if (!res.data.success) {
        toast.error(res.data.message);
        return;
      }

      toast.success(res.data.message);
      if (res.data.skipped?.length) {
        toast(
          (_) => (
            <div className="text-sm">
              <div className="font-medium mb-1">Не вдалося повністю розставити:</div>
              <ul className="list-disc list-inside space-y-0.5">
                {res.data.skipped.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          ),
          { duration: 8000 }
        );
      }
      loadSchedule();
    } catch (err) {
      toast.error('Помилка генерації');
    }
  };

  const saveSchedule = async () => {
    try {
      await api.post('/schedules/save', { schedule, weekNumber: 1 });
      toast.success('Зміни збережено!');
    } catch (err) {
      toast.error('Помилка збереження');
    }
  };

  const clearSchedule = async () => {
    const ok = await confirm({
      title: 'Очищення розкладу',
      message: 'Очистити всі дані? Це видалить розклад локально — щоб застосувати на сервері, потім натисніть "Зберегти зміни".',
      confirmText: 'Очистити',
      danger: true,
    });
    if (!ok) return;
    setSchedule([]);
    toast.success('Розклад очищено!');
  };

  const handleExport = () => {
    exportToExcel(schedule, 'schedule_week1.xlsx');
    toast.success('Excel-файл завантажено');
  };

  const slotsByCell = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const slot of schedule) {
      const key = `${slot.day}-${slot.period}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return map;
  }, [schedule]);

  const getCellBucket = useCallback(
    (day: number, period: number) => slotsByCell.get(`${day}-${period}`) ?? [],
    [slotsByCell]
  );

  const findMatchingSlots = useCallback(
    (period: number, day: number, classId?: number, teacherId?: number) => {
      const bucket = getCellBucket(day, period);
      return bucket.filter(s =>
        (classId === undefined || s.classId === classId) &&
        (teacherId === undefined || s.teacherId === teacherId)
      );
    },
    [getCellBucket]
  );

  const getCellSlotsForAllView = useCallback(
    (period: number, day: number) => {
      const bucket = getCellBucket(day, period);
      if (bucket.length === 0) return [];
      const firstClassId = bucket[0].classId;
      return bucket.filter(s => s.classId === firstClassId);
    },
    [getCellBucket]
  );

  const isTeacherBusy = useCallback(
    (teacherId: number, period: number, day: number, excludeSlot?: any) => {
      const bucket = getCellBucket(day, period);
      return bucket.some(slot =>
        slot.teacherId === teacherId &&
        !(excludeSlot && slot.classId === excludeSlot.classId && slot.teacherId === excludeSlot.teacherId)
      );
    },
    [getCellBucket]
  );

  const isClassBusy = useCallback(
    (classId: number, subjectId: number, isGroupSplit: boolean, period: number, day: number, excludeSlot?: any) => {
      const bucket = getCellBucket(day, period).filter(slot =>
        !(excludeSlot && slot.classId === excludeSlot.classId && slot.teacherId === excludeSlot.teacherId)
      );
      const classSlots = bucket.filter(slot => slot.classId === classId);
      if (classSlots.length === 0) return false;
      if (!isGroupSplit) return true;
      return classSlots.some(slot => !slot.Subject?.isGroupSplit || slot.subjectId !== subjectId);
    },
    [getCellBucket]
  );

  // Той самий ліміт "уроків на день", що використовує generate() на бекенді
  // (ClassGroup.maxLessonsPerDay) — раніше при ручному перенесенні він не
  // перевірявся взагалі.
  const isClassDayLimitReached = useCallback(
    (classId: number, day: number, excludeSlot?: { day: number; period: number; classId: number; teacherId: number }) => {
      const cls = classes.find(c => c.id === classId);
      const maxPerDay = cls?.maxLessonsPerDay ?? DEFAULT_MAX_LESSONS_PER_DAY;
      const count = schedule.filter(s => {
        if (s.classId !== classId || s.day !== day) return false;
        if (
          excludeSlot &&
          s.day === excludeSlot.day &&
          s.period === excludeSlot.period &&
          s.classId === excludeSlot.classId &&
          s.teacherId === excludeSlot.teacherId
        ) return false;
        return true;
      }).length;
      return count >= maxPerDay;
    },
    [classes, schedule]
  );

  const removeExactSlot = (prev: any[], slot: any) => {
    return prev.filter(s => !(
      s.period === slot.period &&
      s.day === slot.day &&
      s.classId === slot.classId &&
      s.teacherId === slot.teacherId
    ));
  };

  const handleLessonDragStart = (e: React.DragEvent, slot: any) => {
    e.stopPropagation();
    setDraggedItem({ ...slot, sourceDay: slot.day, sourcePeriod: slot.period });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, period: number, day: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedItem.sourceDay === day && draggedItem.sourcePeriod === period) {
      setDraggedItem(null);
      return;
    }

    const source = { period: draggedItem.sourcePeriod, day: draggedItem.sourceDay, classId: draggedItem.classId, teacherId: draggedItem.teacherId };
    const isGroupSplit = Boolean(draggedItem.Subject?.isGroupSplit);

    if (isGroupSplit) {
      const proceed = await confirm({
        title: 'Груповий предмет',
        message: 'Це урок групового предмета (клас поділений на групи). Перенесення торкнеться ЛИШЕ цієї групи — друга група лишиться на старому часі. Продовжити?',
        confirmText: 'Перенести',
      });
      if (!proceed) {
        setDraggedItem(null);
        return;
      }
    }

    if (isTeacherBusy(draggedItem.teacherId, period, day, source)) {
      toast.error('Цей вчитель вже зайнятий у цей час на іншому уроці!');
      setDraggedItem(null);
      return;
    }
    if (isClassBusy(draggedItem.classId, draggedItem.subjectId, isGroupSplit, period, day, source)) {
      toast.error('У цього класу вже є урок у цей час!');
      setDraggedItem(null);
      return;
    }
    if (day !== draggedItem.sourceDay && isClassDayLimitReached(draggedItem.classId, day, source)) {
      const cls = classes.find(c => c.id === draggedItem.classId);
      const maxPerDay = cls?.maxLessonsPerDay ?? DEFAULT_MAX_LESSONS_PER_DAY;
      toast.error(`У класу "${cls?.name ?? ''}" вже максимум уроків на цей день (${maxPerDay})`);
      setDraggedItem(null);
      return;
    }

    setSchedule(prev => {
      const withoutSource = removeExactSlot(prev, {
        period: draggedItem.sourcePeriod,
        day: draggedItem.sourceDay,
        classId: draggedItem.classId,
        teacherId: draggedItem.teacherId,
      });
      return [
        ...withoutSource,
        {
          period,
          day,
          teacherId: draggedItem.teacherId,
          subjectId: draggedItem.subjectId,
          classId: draggedItem.classId,
          room: draggedItem.room,
          Teacher: draggedItem.Teacher,
          Subject: draggedItem.Subject,
          ClassGroup: draggedItem.ClassGroup,
          Classroom: draggedItem.Classroom,
        },
      ];
    });

    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  useEffect(() => {
    loadSchedule();
    loadData();
  }, []);

  useEffect(() => { setViewId(''); }, [viewMode]);

  const viewingLabel = viewMode === 'teacher'
    ? teachers.find(t => String(t.id) === viewId)?.User?.fullName
    : viewMode === 'class'
      ? classes.find(c => String(c.id) === viewId)?.name
      : null;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="page-header">
        <h1>Розклад уроків</h1>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <Button variant="primary" size="lg" onClick={generateSchedule}>
            ⚡ Автогенерація
          </Button>

          <select
            value={generateTeacherId}
            onChange={(e) => setGenerateTeacherId(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white"
          >
            <option value="">Генерація: вся школа</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.User?.fullName}</option>
            ))}
          </select>

          <Button variant="secondary" size="lg" onClick={saveSchedule}>
            💾 Зберегти зміни
          </Button>

          <Button variant="secondary" size="lg" onClick={handleExport}>
            📊 Excel
          </Button>

          <Button variant="danger" size="lg" onClick={clearSchedule}>
            🗑️ Очищення
          </Button>
        </div>
      )}
      {!isAdmin && (
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <Button variant="secondary" size="lg" onClick={handleExport}>
            📊 Excel
          </Button>
          <span className="text-xs text-gray-500">Генерація й редагування розкладу доступні лише адміністратору.</span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-2 flex-wrap">
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as ViewMode)}
          className="bg-gray-800 border border-blue-600 rounded-2xl px-4 py-3 text-white"
        >
          <option value="all">👁️ Перегляд: вся школа</option>
          <option value="teacher">👁️ Перегляд по вчителю</option>
          <option value="class">👁️ Перегляд по класу</option>
        </select>

        {viewMode !== 'all' && (
          <select
            value={viewId}
            onChange={(e) => setViewId(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white"
          >
            <option value="">— оберіть {viewMode === 'teacher' ? 'вчителя' : 'клас'} —</option>
            {(viewMode === 'teacher' ? teachers : classes).map((item: any) => (
              <option key={item.id} value={item.id}>
                {viewMode === 'teacher' ? item.User?.fullName : item.name}
              </option>
            ))}
          </select>
        )}

        {viewingLabel && (
          <span className="text-sm text-gray-400">
            Показано лише уроки: <span className="text-emerald-400">{viewingLabel}</span>
          </span>
        )}
        {viewMode === 'all' && (
          <span className="text-xs text-yellow-500">
            ⚠️ Якщо на цей час одночасно є уроки в РІЗНИХ класах — показано лише один клас. Обидві групи одного й того ж класу (поділений предмет) показуються завжди разом.
          </span>
        )}
      </div>

      <Card className="mt-4">
        {loading ? (
          <div className="p-6 text-center text-gray-400">Завантаження...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900">
                  <th className="p-3 text-left w-16">Урок</th>
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт'].map((day, i) => (
                    <th key={i} className="p-3 text-left border-l border-gray-700">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                  <tr key={period} className="border-b border-gray-700 hover:bg-gray-800">
                    <td className="p-3 font-medium">{period}</td>
                    {Array(5).fill(null).map((_, dayIndex) => {
                      const targetClassId = viewMode === 'class' && viewId ? Number(viewId) : undefined;
                      const targetTeacherId = viewMode === 'teacher' && viewId ? Number(viewId) : undefined;

                      let slots: any[] = [];
                      if (viewMode === 'all') {
                        slots = getCellSlotsForAllView(period, dayIndex);
                      } else if (viewId) {
                        slots = findMatchingSlots(period, dayIndex, targetClassId, targetTeacherId);
                      }

                      return (
                        <td
                          key={dayIndex}
                          className="p-3 border-l border-gray-700 min-h-[100px] hover:bg-gray-700 transition-colors"
                          onDragOver={isAdmin ? handleDragOver : undefined}
                          onDrop={isAdmin ? (e) => handleDrop(e, period, dayIndex) : undefined}
                        >
                          {slots.length > 0 ? (
                            <div className="space-y-2">
                              {slots.map((slot, i) => (
                                <div
                                  key={i}
                                  draggable={isAdmin}
                                  onDragStart={isAdmin ? (e) => handleLessonDragStart(e, slot) : undefined}
                                  onDragEnd={handleDragEnd}
                                  className={`text-sm ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''} ${slots.length > 1 ? 'pb-2 border-b border-gray-700 last:border-b-0 last:pb-0' : ''}`}
                                  title={isAdmin ? 'Перетягніть у вільну клітинку, щоб перенести урок' : undefined}
                                >
                                  <div className="font-medium">
                                    {slot.Subject?.name}
                                    {slot.Subject?.isGroupSplit && (
                                      <span className="ml-1 text-[10px] text-purple-400">група</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-emerald-400">{slot.Teacher?.User?.fullName}</div>
                                  <div className="text-xs text-blue-400">{slot.ClassGroup?.name}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 text-center text-xs h-full flex items-center justify-center">
                              {viewMode !== 'all' ? (viewId ? 'Вільно' : '—') : '—'}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Schedule;
