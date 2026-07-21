import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';

const Teachers = () => {
  const confirm = useConfirm();
  const { isAdmin } = useAuth();

  const [teachers, setTeachers] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({ fullName: '', email: '' });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data);
      setFilteredTeachers(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Не вдалося завантажити вчителів');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = teachers.filter(t =>
      t.User?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTeachers(filtered);
  }, [searchTerm, teachers]);

  const openEditForm = (teacher: any) => {
    setEditingTeacher(teacher);
    setFormData({ fullName: teacher.User?.fullName || '', email: teacher.User?.email || '' });
    setShowForm(true);
  };

  const openCreateForm = () => {
    setEditingTeacher(null);
    setFormData({ fullName: '', email: '' });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTeacher(null);
    setFormData({ fullName: '', email: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Введіть ПІБ вчителя');
      return;
    }
    try {
      if (editingTeacher) {
        await api.patch(`/teachers/${editingTeacher.id}`, formData);
      } else {
        await api.post('/teachers', formData);
      }
      toast.success('Збережено!');
      closeForm();
      loadTeachers();
    } catch (err) {
      console.error(err);
      toast.error('Помилка збереження');
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Видалення вчителя',
      message: 'Видалити цього вчителя? Дію не можна скасувати.',
      confirmText: 'Видалити',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/teachers/${id}`);
      toast.success('Видалено');
      loadTeachers();
    } catch (err) {
      toast.error('Помилка видалення (можливо, вчитель прив’язаний до навантаження чи розкладу)');
    }
  };

  if (loading) return <p className="text-center py-20 text-xl">Завантаження...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="page-header flex items-center justify-between">
        <h1>Вчителі</h1>
        {isAdmin && (
          <Button variant="primary" size="lg" onClick={openCreateForm}>
            + Додати вчителя
          </Button>
        )}
      </div>

      <input
        type="text"
        placeholder="🔍 Пошук вчителя..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-lg my-6 focus:outline-none focus:border-blue-500"
      />

      {showForm && isAdmin && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-400 mb-2">ПІБ</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email (необов'язково)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-3"
                placeholder="автоматично, якщо порожньо"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="success">Зберегти</Button>
              <Button type="button" variant="secondary" onClick={closeForm}>Скасувати</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {filteredTeachers.map(teacher => (
          <Card key={teacher.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{teacher.User?.fullName}</p>
                <p className="text-sm text-gray-400">{teacher.User?.email}</p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEditForm(teacher)}>Редагувати</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(teacher.id)}>Видалити</Button>
                </div>
              )}
            </div>
          </Card>
        ))}
        {filteredTeachers.length === 0 && (
          <p className="text-gray-500 italic text-center py-10">Вчителів не знайдено</p>
        )}
      </div>
    </div>
  );
};

export default Teachers;
