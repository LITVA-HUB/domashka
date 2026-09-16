import { useState, useEffect } from 'react';
import { User } from './types';
import { loadData } from './store';
import { ToastContainer, useToast } from './components/shared';
import { AuthScreen } from './components/AuthScreen';
import { StudentPanel } from './components/StudentPanel';
import { TeacherPanel } from './components/TeacherPanel';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<'auth' | 'student' | 'teacher'>('auth');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const savedUserId = localStorage.getItem('hw-current-user');
    if (savedUserId) {
      const data = loadData();
      const user = data.users.find(u => u.id === savedUserId);
      if (user) {
        setCurrentUser(user);
        setScreen(user.role === 'teacher' ? 'teacher' : 'student');
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('hw-current-user', user.id);
    setScreen(user.role === 'teacher' ? 'teacher' : 'student');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hw-current-user');
    setScreen('auth');
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {screen === 'auth' || !currentUser ? (
        <AuthScreen onLogin={handleLogin} addToast={addToast} />
      ) : currentUser.role === 'student' ? (
        <StudentPanel user={currentUser} onLogout={handleLogout} addToast={addToast} />
      ) : (
        <TeacherPanel user={currentUser} onLogout={handleLogout} addToast={addToast} />
      )}
    </>
  );
}

export default App;
