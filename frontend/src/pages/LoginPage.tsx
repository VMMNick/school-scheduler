import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      });
      login(res.data.access_token, res.data.user);
      navigate('/');
    } catch (err: any) {
      if (err?.response) {
        // Сервер відповів, але відхилив запит — це справді невірні дані
        setError(err.response.data?.message || 'Невірний email або пароль');
      } else if (err?.request) {
        // Запит пішов, але відповіді не було — сервер недоступний за цією адресою
        setError(`Не вдалося з'єднатися з сервером (${API_URL}). Перевірте, чи запущений бекенд і чи правильна адреса в налаштуваннях.`);
      } else {
        setError('Сталася невідома помилка. Спробуйте ще раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">Вхід до системи</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              autoCapitalize="none"
              autoCorrect="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" variant="primary" size="lg">
            {loading ? 'Вхід...' : 'Увійти'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
