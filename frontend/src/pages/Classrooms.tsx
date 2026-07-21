import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', capacity: 30 };

const Classrooms = () => {
  const { isAdmin } = useAuth();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [filteredClassrooms, setFilteredClassrooms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<any>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/classrooms');
      setClassrooms(res.data);
      setFilteredClassrooms(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Не вдалося завантажити приміщення');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = classrooms.filter(room => room.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredClassrooms(filtered);
  }, [searchTerm, classrooms]);

  const openCreateForm = () => {
    setEditingClassroom(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (room: any) => {
    setEditingClassroom(room);
    setFormData({ name: room.name, capacity: room.capacity });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingClassroom(null);
    setFormData(emptyForm);
  };

  const saveClassroom = async () => {
    if (!formData.name) return toast.error('Введіть назву');
    try {
      if (editingClassroom) {
        await api.patch(`/classrooms/${editingClassroom.id}`, formData);
      } else {
        await api.post('/classrooms', formData);
      }
      toast.success('Збережено!');
      closeForm();
      loadClassrooms();
    } catch (err) {
      toast.error('Помилка');
    }
  };

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="text-3xl font-bold">Приміщення</h1>
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
            placeholder="Назва приміщення"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 mb-4"
          />
          <input
            type="number"
            placeholder="Місткість"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: +e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 mb-4"
          />
          <div className="flex gap-3">
            <Button onClick={saveClassroom} className="flex-1">Зберегти</Button>
            <Button variant="secondary" onClick={closeForm} className="flex-1">Скасувати</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClassrooms.map(room => (
          <Card key={room.id} className="p-5">
            <div className="text-center">
              <div className="text-5xl mb-3">🏫</div>
              <h3 className="font-semibold text-lg">{room.name}</h3>
              <p className="text-gray-400 text-sm">Місткість: {room.capacity}</p>
            </div>
            {isAdmin && (
              <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => openEditForm(room)}>
                ✏️ Редагувати
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Classrooms;
