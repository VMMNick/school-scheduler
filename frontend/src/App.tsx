import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import { AuthProvider } from './context/AuthContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Teachers = lazy(() => import('./pages/Teachers'));
const TeacherLoad = lazy(() => import('./pages/TeacherLoad'));
const Subjects = lazy(() => import('./pages/Subjects'));
const Classes = lazy(() => import('./pages/Classes'));
const Classrooms = lazy(() => import('./pages/Classrooms'));
const Settings = lazy(() => import('./pages/Settings'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64 text-gray-400">Завантаження сторінки...</div>
);

const App = () => {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' },
            success: { iconTheme: { primary: '#10b981', secondary: '#1f2937' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1f2937' } },
          }}
        />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex min-h-screen bg-bg text-main">
                    <Sidebar />
                    <main className="flex-1 ml-60 p-6 lg:p-8 overflow-auto">
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/schedule" element={<Schedule />} />
                          <Route path="/teachers" element={<Teachers />} />
                          <Route path="/teacher-load" element={<TeacherLoad />} />
                          <Route path="/subjects" element={<Subjects />} />
                          <Route path="/classes" element={<Classes />} />
                          <Route path="/classrooms" element={<Classrooms />} />
                          <Route path="/settings" element={<Settings />} />
                        </Routes>
                      </Suspense>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ConfirmProvider>
    </AuthProvider>
  );
};

export default App;
