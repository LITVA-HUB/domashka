import { useState } from 'react';
import { User, Toast } from '../types';
import { AVATARS_STUDENT, AVATARS_TEACHER } from '../types';
import { loadData, generateId, addUser, authenticate, isNumberTaken } from '../store';
import { GraduationCap, User as UserIcon, AlertCircle } from 'lucide-react';

export function AuthScreen({ onLogin, addToast }: { onLogin: (user: User) => void; addToast: (type: Toast['type'], msg: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [fullName, setFullName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const data = loadData();

    if (mode === 'login') {
      if (!studentNumber.trim() || !password) { setError('Заполните все поля'); return; }
      const user = authenticate(data, studentNumber, password);
      if (!user) { setError('Неверный номер или пароль'); return; }
      addToast('success', `Добро пожаловать, ${user.fullName.split(' ')[0]}!`);
      onLogin(user);
    } else {
      if (!fullName.trim() || !studentNumber.trim() || !password || !confirmPassword) { setError('Заполните все поля'); return; }
      if (password !== confirmPassword) { setError('Пароли не совпадают'); return; }
      if (password.length < 4) { setError('Пароль минимум 4 символа'); return; }
      if (isNumberTaken(data, studentNumber)) { setError('Этот номер уже занят'); return; }
      const newUser: User = {
        id: generateId(), fullName: fullName.trim(), studentNumber: studentNumber.trim(),
        password, role, avatar: selectedAvatar || (role === 'student' ? AVATARS_STUDENT[0] : AVATARS_TEACHER[0]),
        createdAt: Date.now(),
      };
      const newData = addUser(data, newUser);
      const createdUser = newData.users.find(u => u.id === newUser.id)!;
      addToast('success', 'Регистрация успешна!');
      onLogin(createdUser);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30 mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-1">Домашние задания</h1>
          <p className="text-blue-300/70 text-sm">Платформа для учёбы</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-up">
          <div className="flex mb-6 bg-white/5 rounded-xl p-1">
            <button onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
              Вход
            </button>
            <button onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1.5 block">Роль</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setRole('student'); setSelectedAvatar(''); }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${role === 'student' ? 'bg-green-600/20 border border-green-500/50 text-green-300' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
                      <GraduationCap className="w-4 h-4" /> Ученик
                    </button>
                    <button type="button" onClick={() => { setRole('teacher'); setSelectedAvatar(''); }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${role === 'teacher' ? 'bg-purple-600/20 border border-purple-500/50 text-purple-300' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
                      <UserIcon className="w-4 h-4" /> Преподаватель
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1.5 block">Аватар</label>
                  <div className="flex gap-2 flex-wrap">
                    {(role === 'student' ? AVATARS_STUDENT : AVATARS_TEACHER).map(a => (
                      <button key={a} type="button" onClick={() => setSelectedAvatar(a)}
                        className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${selectedAvatar === a ? 'bg-blue-600 ring-2 ring-blue-400 scale-110' : 'bg-white/5 hover:bg-white/10'}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1.5 block">ФИО</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Иванов Иван Иванович"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all" />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">
                {mode === 'login' ? 'Номер / ID' : 'Уникальный номер'}
              </label>
              <input type="text" value={studentNumber} onChange={e => setStudentNumber(e.target.value)}
                placeholder={role === 'student' ? 'Например: 101' : 'Например: T001'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all" />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all" />
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Подтвердите пароль</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all" />
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0">
              {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 p-3 bg-white/5 rounded-xl text-xs text-gray-400">
              <p className="font-medium text-gray-300 mb-1">Демо-доступ:</p>
              <p>Преподаватель: <span className="text-blue-300 font-mono">T001</span> / <span className="text-blue-300 font-mono">teacher123</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
