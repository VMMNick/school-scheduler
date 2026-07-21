import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const CIRCUMFERENCE = 264; // 2 * π * r(42), заокруглено — узгоджено з розміром кола нижче

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    lessonsPerWeek: 0,
    teachers: 0,
    classes: 0,
    occupancy: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [scheduleRes, teachersRes, classesRes] = await Promise.all([
          api.get('/schedules/week?weekNumber=1'),
          api.get('/teachers'),
          api.get('/classes')
        ]);

        const lessons = scheduleRes.data?.length || 0;
        const teachersCount = teachersRes.data?.length || 0;
        const classesCount = classesRes.data?.length || 0;
        const occupancy = lessons > 0 ? Math.round((lessons / (classesCount * 35)) * 100) : 0;

        setStats({
          lessonsPerWeek: lessons,
          teachers: teachersCount,
          classes: classesCount,
          occupancy: occupancy
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <p className="text-center py-20 text-xl text-gray-400">Завантаження...</p>;

  // Кільце тепер справді відображає stats.occupancy, а не захардкоджені числа.
  const occupancyClamped = Math.min(Math.max(stats.occupancy, 0), 100);
  const dashOffset = CIRCUMFERENCE - (CIRCUMFERENCE * occupancyClamped) / 100;

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4">
      {/* Заголовок */}
      <div className="page-header">
        <h1>Дашборд</h1>
        <p>Добрий день! Огляд системи</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 hover:border-blue-500/30 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs">Уроків на тиждень</p>
              <p className="text-4xl font-bold text-white mt-1">{stats.lessonsPerWeek}</p>
            </div>
            <div className="text-4xl opacity-70 group-hover:scale-110 transition-transform">📅</div>
          </div>
        </Card>

        <Card className="p-5 hover:border-emerald-500/30 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs">Вчителів</p>
              <p className="text-4xl font-bold text-white mt-1">{stats.teachers}</p>
            </div>
            <div className="text-4xl opacity-70 group-hover:scale-110 transition-transform">👨‍🏫</div>
          </div>
        </Card>

        <Card className="p-5 hover:border-purple-500/30 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs">Класів</p>
              <p className="text-4xl font-bold text-white mt-1">{stats.classes}</p>
            </div>
            <div className="text-4xl opacity-70 group-hover:scale-110 transition-transform">🏫</div>
          </div>
        </Card>

        <Card className="p-5 hover:border-amber-500/30 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs">Заповненість</p>
              <p className="text-4xl font-bold text-amber-400 mt-1">{stats.occupancy}%</p>
            </div>
            <div className="text-4xl opacity-70 group-hover:scale-110 transition-transform">📊</div>
          </div>
        </Card>
      </div>

      {/* Діаграма + Інформація */}
      <Card className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          {/* Кругова діаграма зліва — тепер одне кільце = реальна заповненість розкладу */}
          <div className="lg:col-span-3 flex justify-center">
            <div className="relative w-80 h-80">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="18" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="#d97706" strokeWidth="18"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-7xl font-bold text-white">{stats.occupancy}%</div>
                <div className="text-sm text-gray-400 mt-2">заповненість розкладу</div>
              </div>
            </div>
          </div>

          {/* Інформація справа */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 bg-blue-500 rounded"></div>
              <div className="flex-1">
                <p className="text-white text-lg">Уроки на тиждень</p>
                <p className="text-4xl font-bold text-blue-400">{stats.lessonsPerWeek}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 bg-emerald-500 rounded"></div>
              <div className="flex-1">
                <p className="text-white text-lg">Вчителі</p>
                <p className="text-4xl font-bold text-emerald-400">{stats.teachers}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 bg-purple-500 rounded"></div>
              <div className="flex-1">
                <p className="text-white text-lg">Класи</p>
                <p className="text-4xl font-bold text-purple-400">{stats.classes}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Швидкі дії */}
      <Card title="⚡ Швидкі дії" className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="primary" size="lg" onClick={() => navigate('/schedule')} className="h-20 text-xl w-full">📅 Новий розклад</Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/teacher-load')} className="h-20 text-xl w-full">👨‍🏫 Навантаження</Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/settings')} className="h-20 text-xl w-full">⚙️ Налаштування</Button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
