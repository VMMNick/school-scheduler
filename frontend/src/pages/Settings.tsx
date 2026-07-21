import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

const DEFAULT_BREAK_DURATION = 15;

interface SettingsState {
  schoolName: string;
  academicYear: string;
  maxLessonsPerDay: number;
  startTime: string;
  weekStart: string;
  breaks: number[];
}

const defaultSettings: SettingsState = {
  schoolName: 'Школа № 42',
  academicYear: '2025-2026',
  maxLessonsPerDay: 7,
  startTime: '08:30',
  weekStart: 'monday',
  breaks: [15, 15, 20, 15, 15, 20],
};

const Settings = () => {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setSettings({
          ...defaultSettings,
          ...res.data,
          breaks: Array.isArray(res.data.breaks) ? res.data.breaks : defaultSettings.breaks,
        });
      }
    } catch (err) {
      console.log('Стандартні налаштування');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setSettings((prev) => {
      if (name === 'maxLessonsPerDay') {
        const nextValue = Math.max(1, Number(value) || 1);
        const nextBreaks = [...prev.breaks];
        const desiredBreakCount = Math.max(0, nextValue - 1);
        if (nextBreaks.length < desiredBreakCount) {
          while (nextBreaks.length < desiredBreakCount) {
            nextBreaks.push(DEFAULT_BREAK_DURATION);
          }
        } else {
          nextBreaks.length = desiredBreakCount;
        }
        return { ...prev, [name]: nextValue, breaks: nextBreaks } as SettingsState;
      }

      return { ...prev, [name]: value } as SettingsState;
    });
  };

  const handleBreakChange = (index: number, value: string) => {
    setSettings((prev) => {
      const nextBreaks = [...prev.breaks];
      nextBreaks[index] = Math.max(0, Number(value) || 0);
      return { ...prev, breaks: nextBreaks };
    });
  };

  const addBreak = () => {
    setSettings((prev) => ({ ...prev, breaks: [...prev.breaks, DEFAULT_BREAK_DURATION] }));
  };

  const removeBreak = (index: number) => {
    setSettings((prev) => ({ ...prev, breaks: prev.breaks.filter((_, i) => i !== index) }));
  };

  const saveSettings = async () => {
    try {
      await api.post('/settings/save', settings);
      toast.success('Збережено!');
    } catch (err) {
      toast.error('Помилка збереження');
    }
  };

  return (
    <div className="page-header">
      <h1>Налаштування</h1>
      {!isAdmin && (
        <p className="text-xs text-gray-500 mt-1">Перегляд лише для читання — редагування доступне адміністратору.</p>
      )}

      <Card className="p-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Назва школи</label>
            <input
              type="text"
              name="schoolName"
              value={settings.schoolName}
              onChange={handleChange}
              disabled={!isAdmin}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Навчальний рік</label>
            <input
              type="text"
              name="academicYear"
              value={settings.academicYear}
              onChange={handleChange}
              disabled={!isAdmin}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Початок уроків</label>
            <input
              type="time"
              name="startTime"
              value={settings.startTime}
              onChange={handleChange}
              disabled={!isAdmin}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Початок тижня</label>
            <select
              name="weekStart"
              value={settings.weekStart}
              onChange={handleChange}
              disabled={!isAdmin}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 disabled:opacity-60"
            >
              <option value="monday">Понеділок</option>
              <option value="sunday">Неділя</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Макс. уроків на день</label>
            <input
              type="number"
              name="maxLessonsPerDay"
              min={1}
              value={settings.maxLessonsPerDay}
              onChange={handleChange}
              disabled={!isAdmin}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 disabled:opacity-60"
            />
          </div>

        </div>
      </Card>

      <Card className="p-6 mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Перерви</h2>
            <p className="text-sm text-gray-400">Задайте тривалість перерв після кожного уроку.</p>
          </div>
          {isAdmin && (
            <Button variant="secondary" size="md" onClick={addBreak}>
              + Додати перерву
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {settings.breaks.map((breakMinutes, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-[180px_1fr_80px] gap-4 items-center">
              <div className="text-sm text-gray-300">Перерва після уроку {index + 1}</div>
              <input
                type="number"
                min={0}
                value={breakMinutes}
                onChange={(e) => handleBreakChange(index, e.target.value)}
                disabled={!isAdmin}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 disabled:opacity-60"
              />
              {isAdmin && (
                <Button variant="danger" size="md" onClick={() => removeBreak(index)}>
                  Видалити
                </Button>
              )}
            </div>
          ))}

          {settings.breaks.length === 0 && (
            <div className="text-sm text-gray-500">Наразі не задано жодних перерв.</div>
          )}
        </div>
      </Card>

      {isAdmin && (
        <div className="flex gap-4 mt-6">
          <Button variant="primary" size="lg" onClick={saveSettings} disabled={loading}>
            💾 Зберегти
          </Button>
          <Button variant="secondary" size="lg" onClick={loadSettings} disabled={loading}>
            Оновити
          </Button>
        </div>
      )}
    </div>
  );
};

export default Settings;
