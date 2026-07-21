import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';

const TeacherLoad = () => {
  const confirm = useConfirm();
  const { isAdmin } = useAuth();

  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loads, setLoads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'hours'>('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTeacherName = (teacher: any) => teacher?.User?.fullName ?? teacher?.fullName ?? 'Без імені';

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [tRes, sRes, cRes, lRes] = await Promise.all([
          api.get('/teachers'),
          api.get('/subjects'),
          api.get('/classes'),
          api.get('/teacher-load'),
        ]);

        setTeachers(
          tRes.data
            .map((teacher: any) => ({
              ...teacher,
              displayName: getTeacherName(teacher),
            }))
            .sort((a: any, b: any) => a.displayName.localeCompare(b.displayName))
        );
        setSubjects(sRes.data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
        setClasses(cRes.data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
        setLoads(Array.isArray(lRes.data) ? lRes.data : []);
      } catch (err) {
        console.error('Помилка завантаження даних навантаження вчителів:', err);
        setError('Не вдалося завантажити дані для сторінки навантаження вчителів. Оновіть сторінку або перевірте з’єднання.');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const addLoad = (teacherId: number) => {
    setLoads([...loads, {
      teacherId,
      subjectId: 0,
      classId: 0,
      hoursPerWeek: 2
    }]);
  };

  const updateLoad = (index: number, field: string, value: any) => {
    const newLoads = [...loads];
    if (field === 'hoursPerWeek') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 40) {
        toast.error('Години повинні бути від 1 до 40');
        return;
      }
      newLoads[index] = { ...newLoads[index], [field]: num };
    } else {
      newLoads[index] = { ...newLoads[index], [field]: value };
    }
    setLoads(newLoads);
  };

  const removeLoad = async (index: number) => {
    const ok = await confirm({
      title: 'Видалення навантаження',
      message: 'Видалити цей запис навантаження?',
      confirmText: 'Видалити',
      danger: true,
    });
    if (!ok) return;
    setLoads(loads.filter((_, i) => i !== index));
  };

  // Знаходить дублікати (той самий вчитель+предмет+клас двічі) — без цього
  // збереження мовчки створювало б два однакові записи й подвоювало години
  // при генерації розкладу.
  const findDuplicateCombo = () => {
    const seen = new Map<string, any>();
    for (const load of loads) {
      const key = `${load.teacherId}-${load.subjectId}-${load.classId}`;
      if (seen.has(key)) {
        return { key, load };
      }
      seen.set(key, load);
    }
    return null;
  };

  const saveLoads = async () => {
    if (loads.length === 0) {
      toast.error('Немає даних для збереження');
      return;
    }

    for (const load of loads) {
      if (!load.subjectId || !load.classId) {
        toast.error('Будь ласка, оберіть предмет і клас для всіх записів');
        return;
      }
    }

    const duplicate = findDuplicateCombo();
    if (duplicate) {
      const teacherName = teachers.find(t => t.id === duplicate.load.teacherId)?.displayName ?? 'Вчитель';
      const subjectName = subjects.find(s => s.id === duplicate.load.subjectId)?.name ?? 'предмет';
      const className = classes.find(c => c.id === duplicate.load.classId)?.name ?? 'клас';
      toast.error(`Дублікат: "${teacherName}" — "${subjectName}" у класі "${className}" вказано двічі. Приберіть один із записів.`, { duration: 6000 });
      return;
    }

    try {
      await api.post('/teacher-load/save', loads);
      toast.success('Навантаження успішно збережено!');
      setLoads(loads);
    } catch (err) {
      console.error(err);
      toast.error('Помилка збереження');
    }
  };

  const getTeacherHours = (teacherId: number) => {
    return loads
      .filter(l => l.teacherId === teacherId)
      .reduce((sum, load) => sum + Number(load.hoursPerWeek || 0), 0);
  };

  const getHoursColor = (hours: number) => {
    if (hours < 14) return 'text-red-400';
    if (hours <= 17) return 'text-white';
    return 'text-emerald-400';
  };

  if (loading) return <p className="text-center py-20 text-xl">Завантаження...</p>;
  if (error) return <p className="text-center py-20 text-xl text-red-400">{error}</p>;

  const sortedTeachers = [...teachers].sort((a, b) => {
    if (sortBy === 'hours') {
      return getTeacherHours(b.id) - getTeacherHours(a.id);
    } else {
      return (a.displayName || '').localeCompare(b.displayName || '');
    }
  });

  const filteredTeachers = sortedTeachers.filter(teacher =>
    (teacher.displayName ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="page-header">
        <h1>Навантаження вчителів</h1>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Пошук вчителя..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'hours')}
          className="bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500"
        >
          <option value="name">За алфавітом</option>
          <option value="hours">За годинниками (від більше до менше)</option>
        </select>

        {isAdmin && (
          <Button variant="primary" size="lg" onClick={saveLoads}>
            💾 Зберегти
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {filteredTeachers.map(teacher => {
          const teacherLoads = loads.filter(l => l.teacherId === teacher.id);
          const totalHours = getTeacherHours(teacher.id);
          const hoursColor = getHoursColor(totalHours);

          return (
            <Card key={teacher.id}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">👨‍🏫</div>
                  <div>
                    <h3 className="text-xl font-semibold">{teacher.displayName}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Загальне навантаження</p>
                  <p className={`text-3xl font-bold ${hoursColor}`}>
                    {totalHours} годин
                  </p>
                </div>
              </div>

              {isAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addLoad(teacher.id)}
                  className="mb-6"
                >
                  + Додати предмет та клас
                </Button>
              )}

              {teacherLoads.length === 0 && (
                <p className="text-gray-500 italic pl-4">Поки що немає навантаження</p>
              )}

              {teacherLoads.map((load, idx) => (
                <div key={idx} className="bg-gray-800/70 p-6 rounded-3xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Предмет</label>
                    <select
                      value={load.subjectId}
                      disabled={!isAdmin}
                      onChange={(e) => updateLoad(loads.indexOf(load), 'subjectId', Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-3 disabled:opacity-60"
                    >
                      <option value={0}>Оберіть предмет</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Клас</label>
                    <select
                      value={load.classId}
                      disabled={!isAdmin}
                      onChange={(e) => updateLoad(loads.indexOf(load), 'classId', Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-3 disabled:opacity-60"
                    >
                      <option value={0}>Оберіть клас</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Годин на тиждень</label>
                    <input
                      type="number"
                      value={load.hoursPerWeek}
                      disabled={!isAdmin}
                      onChange={(e) => updateLoad(loads.indexOf(load), 'hoursPerWeek', Number(e.target.value))}
                      min="1"
                      max="40"
                      className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-3 text-center disabled:opacity-60"
                    />
                  </div>

                  {isAdmin && (
                    <Button
                      variant="danger"
                      size="lg"
                      onClick={() => removeLoad(loads.indexOf(load))}
                    >
                      Видалити
                    </Button>
                  )}
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherLoad;
