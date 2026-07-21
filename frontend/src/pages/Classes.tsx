import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', maxLessonsPerDay: 7 };

const Classes = () => {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [formData, setFormData] = useState<{ name: string; maxLessonsPerDay?: number }>(emptyForm);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
      setFilteredClasses(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Не вдалося завантажити класи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = classes.filter(cls => cls.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredClasses(filtered);
  }, [searchTerm, classes]);

  const openCreateForm = () => {
    setEditingClass(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (cls: any) => {
    setEditingClass(cls);
    setFormData({ name: cls.name, maxLessonsPerDay: cls.maxLessonsPerDay ?? 7 });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingClass(null);
    setFormData(emptyForm);
  };

  const saveClass = async () => {
    if (!formData.name) return toast.error('Введіть назву');
    try {
      if (editingClass) {
        await api.patch(`/classes/${editingClass.id}`, formData);
      } else {
        await api.post('/classes', formData);
      }
      toast.success('Збережено!');
      closeForm();
      loadClasses();
    } catch (err) {
      toast.error('Помилка');
    }
  };

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="text-3xl font-bold">Класи</h1>
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
            placeholder="Назва класу"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 mb-4"
          />
          <input
            type="number"
            min={1}
            max={8}
            placeholder="Максимум уроків на день"
            value={formData.maxLessonsPerDay}
            onChange={(e) => setFormData({ ...formData, maxLessonsPerDay: Number(e.target.value) })}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 mb-4"
          />
          <div className="flex gap-3">
            <Button onClick={saveClass} className="flex-1">Зберегти</Button>
            <Button variant="secondary" onClick={closeForm} className="flex-1">Скасувати</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map(cls => (
          <Card key={cls.id} className="p-5">
            <div className="text-center">
              <div className="text-5xl mb-3">👥</div>
              <h3 className="font-semibold text-lg">{cls.name}</h3>
            </div>
            {isAdmin && (
              <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => openEditForm(cls)}>
                ✏️ Редагувати
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Classes;
