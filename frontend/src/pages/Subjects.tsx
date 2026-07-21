import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', isGroupSplit: false };

const Subjects = () => {
  const { isAdmin } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
      setFilteredSubjects(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Не вдалося завантажити предмети');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = subjects.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredSubjects(filtered);
  }, [searchTerm, subjects]);

  const openCreateForm = () => {
    setEditingSubject(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (subject: any) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, isGroupSplit: Boolean(subject.isGroupSplit) });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSubject(null);
    setFormData(emptyForm);
  };

  const saveSubject = async () => {
    if (!formData.name) return toast.error('Введіть назву');
    try {
      if (editingSubject) {
        await api.patch(`/subjects/${editingSubject.id}`, formData);
      } else {
        await api.post('/subjects', formData);
      }
      toast.success('Збережено!');
      closeForm();
      loadSubjects();
    } catch (err) {
      toast.error('Помилка');
    }
  };

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="text-3xl font-bold">Предмети</h1>
        {isAdmin && (
          <Button variant="primary" size="md" onClick={openCreateForm}>+ Додати</Button>
        )}
      </div>

      <input
        type="text"
        placeholder="🔍 Пошук..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 mb-6"
      />

      {showForm && isAdmin && (
        <Card className="mb-6 p-6">
          <input
            type="text"
            placeholder="Назва предмету"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 mb-4"
          />
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isGroupSplit: !formData.isGroupSplit })}
            className={`w-full rounded-2xl border px-4 py-3 mb-4 text-left transition ${formData.isGroupSplit ? 'border-emerald-500 bg-emerald-600/10 text-emerald-300' : 'border-gray-700 bg-gray-800 text-gray-200'}`}
          >
            <div className="font-medium">{formData.isGroupSplit ? '✅ Предмет поділяється на групи' : '⬜ Предмет не поділяється на групи'}</div>
            <div className="text-sm text-gray-400 mt-1">Якщо увімкнено, генератор розставлятиме такі уроки синхронно для пов’язаних класів.</div>
          </button>
          <div className="flex gap-3">
            <Button onClick={saveSubject} className="flex-1">Зберегти</Button>
            <Button variant="secondary" onClick={closeForm} className="flex-1">Скасувати</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map(subject => (
          <Card key={subject.id} className="p-5">
            <div className="text-center">
              <div className="text-5xl mb-3">📚</div>
              <h3 className="font-semibold text-lg">{subject.name}</h3>
              {subject.isGroupSplit && (
                <span className="inline-flex items-center rounded-full bg-emerald-600/20 px-3 py-1 text-xs font-medium text-emerald-300 mt-3">
                  Поділ на групи
                </span>
              )}
            </div>
            {isAdmin && (
              <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => openEditForm(subject)}>
                ✏️ Редагувати
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Subjects;
