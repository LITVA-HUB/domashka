import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Assignment, Submission, FileAttachment, SubmissionStatus } from './types';
import {
  loadData, saveData, generateId, addUser, addAssignment, deleteAssignment,
  addSubmission, updateSubmission, authenticate, isNumberTaken,
  formatDate, formatDueDate, isOverdue, fileToDataUrl, formatFileSize,
} from './store';

type Screen = 'auth' | 'student' | 'teacher';

const AVATARS = ['👨‍🎓', '👩‍🎓', '🧑‍🎓', '👨‍💻', '👩‍💻', '🧑‍💻', '📚', '🎓'];
const TEACHER_AVATARS = ['👨‍🏫', '👩‍🏫', '🧑‍🏫', '📖', '🔬', '🧮'];
const SUBJECTS = ['Математика', 'Русский язык', 'Литература', 'Физика', 'Химия', 'Биология', 'История', 'Информатика', 'Английский язык', 'География'];

// ==================== AUTH SCREEN ====================
function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
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
      if (!studentNumber || !password) {
        setError('Заполните все поля');
        return;
      }
      const user = authenticate(data, studentNumber, password);
      if (!user) {
        setError('Неверный номер или пароль');
        return;
      }
      onLogin(user);
    } else {
      if (!fullName || !studentNumber || !password || !confirmPassword) {
        setError('Заполните все поля');
        return;
      }
      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }
      if (password.length < 4) {
        setError('Пароль минимум 4 символа');
        return;
      }
      if (isNumberTaken(data, studentNumber)) {
        setError('Этот номер уже занят');
        return;
      }
      const newUser: User = {
        id: generateId(),
        fullName,
        studentNumber,
        password,
        role,
        avatar: selectedAvatar || (role === 'student' ? AVATARS[0] : TEACHER_AVATARS[0]),
        createdAt: Date.now(),
      };
      const newData = addUser(data, newUser);
      const createdUser = newData.users.find(u => u.id === newUser.id)!;
      onLogin(createdUser);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-5xl mb-3">📚</div>
          <h1 className="text-3xl font-black text-white">Домашние задания</h1>
          <p className="text-blue-300/70 text-sm mt-1">Платформа для учёбы</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-up">
          {/* Tabs */}
          <div className="flex mb-6 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'register' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                {/* Role selection */}
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1.5 block">Я</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setRole('student'); setSelectedAvatar(''); }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        role === 'student' ? 'bg-green-600/20 border border-green-500/50 text-green-300' : 'bg-white/5 border border-white/10 text-gray-400'
                      }`}
                    >
                      🎓 Ученик
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRole('teacher'); setSelectedAvatar(''); }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        role === 'teacher' ? 'bg-purple-600/20 border border-purple-500/50 text-purple-300' : 'bg-white/5 border border-white/10 text-gray-400'
                      }`}
                    >
                      👨‍🏫 Преподаватель
                    </button>
                  </div>
                </div>

                {/* Avatar */}
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1.5 block">Аватар</label>
                  <div className="flex gap-2 flex-wrap">
                    {(role === 'student' ? AVATARS : TEACHER_AVATARS).map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setSelectedAvatar(a)}
                        className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                          selectedAvatar === a ? 'bg-blue-600 ring-2 ring-blue-400 scale-110' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Full name */}
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1.5 block">ФИО</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Иванов Иван Иванович"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                </div>
              </>
            )}

            {/* Student number */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">
                {mode === 'login' ? 'Номер ученика / ID преподавателя' : 'Номер (уникальный идентификатор)'}
              </label>
              <input
                type="text"
                value={studentNumber}
                onChange={e => setStudentNumber(e.target.value)}
                placeholder={role === 'student' ? 'Например: 101' : 'Например: T001'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Подтвердите пароль</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              {mode === 'login' ? '🔑 Войти' : '✨ Зарегистрироваться'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 p-3 bg-white/5 rounded-xl text-xs text-gray-400">
              <p className="font-medium text-gray-300 mb-1">Демо-доступ преподавателя:</p>
              <p>Номер: <span className="text-blue-300">T001</span> | Пароль: <span className="text-blue-300">teacher123</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== FILE UPLOAD COMPONENT ====================
function FileUpload({ files, onFilesChange, maxFiles = 10 }: { files: FileAttachment[]; onFilesChange: (f: FileAttachment[]) => void; maxFiles?: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (fileList: FileList) => {
    const newFiles: FileAttachment[] = [];
    for (let i = 0; i < Math.min(fileList.length, maxFiles - files.length); i++) {
      const file = fileList[i];
      if (file.size > 5 * 1024 * 1024) {
        alert(`Файл "${file.name}" слишком большой (макс. 5 МБ)`);
        continue;
      }
      const dataUrl = await fileToDataUrl(file);
      newFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
      });
    }
    onFilesChange([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          dragOver ? 'border-blue-400 bg-blue-500/10' : 'border-white/20 hover:border-white/40 bg-white/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={e => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="text-2xl mb-1">📎</div>
        <p className="text-sm text-gray-300">Нажмите или перетащите файлы</p>
        <p className="text-xs text-gray-500 mt-1">Макс. 5 МБ на файл</p>
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 group">
              <span className="text-lg">
                {file.type.includes('image') ? '🖼️' : file.type.includes('pdf') ? '📄' : '📁'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== STUDENT PANEL ====================
function StudentPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [data, setData] = useState(loadData());
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmission, setShowSubmission] = useState(false);

  const mySubmissions = data.submissions.filter(s => s.studentId === user.id);
  const assignments = data.assignments;

  const getSubmission = (assignmentId: string): Submission | undefined => {
    return data.submissions.find(s => s.assignmentId === assignmentId && s.studentId === user.id);
  };

  const getStatusBadge = (assignment: Assignment) => {
    const sub = getSubmission(assignment.id);
    if (!sub) {
      if (isOverdue(assignment.dueDate)) {
        return <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/30">Просрочено</span>;
      }
      return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30">Не начато</span>;
    }
    switch (sub.status) {
      case 'submitted':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">На проверке</span>;
      case 'reviewed':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">Проверено {sub.score !== null ? `• ${sub.score}/${assignment.maxScore}` : ''}</span>;
      case 'returned':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">Возвращено</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{user.avatar}</span>
            <div>
              <p className="text-white font-semibold text-sm">{user.fullName}</p>
              <p className="text-gray-400 text-xs">Ученик • №{user.studentNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
              <span className="text-yellow-400">⭐</span>
              <span className="text-sm text-white font-medium">
                {mySubmissions.reduce((sum, s) => sum + (s.score || 0), 0)} баллов
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              title="Выйти"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {selectedAssignment ? (
          <AssignmentDetailView
            assignment={selectedAssignment}
            user={user}
            data={data}
            setData={setData}
            onBack={() => { setSelectedAssignment(null); setShowSubmission(false); }}
          />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{assignments.length}</p>
                <p className="text-xs text-gray-400">Всего заданий</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-400">{mySubmissions.filter(s => s.status === 'reviewed').length}</p>
                <p className="text-xs text-gray-400">Проверено</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-blue-400">{mySubmissions.filter(s => s.status === 'submitted').length}</p>
                <p className="text-xs text-gray-400">На проверке</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-yellow-400">{mySubmissions.reduce((s, sub) => s + (sub.score || 0), 0)}</p>
                <p className="text-xs text-gray-400">Баллов</p>
              </div>
            </div>

            {/* Assignments list */}
            <h2 className="text-lg font-bold text-white mb-4">📋 Домашние задания</h2>
            {assignments.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p>Пока нет заданий</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map(a => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAssignment(a)}
                    className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 hover:bg-white/8 cursor-pointer transition-all hover:border-white/20 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {a.subject}
                          </span>
                          {getStatusBadge(a)}
                        </div>
                        <h3 className="text-white font-semibold group-hover:text-blue-300 transition-colors">{a.title}</h3>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{a.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>👨‍🏫 {a.teacherName}</span>
                          <span>📅 до {formatDueDate(a.dueDate)}</span>
                          <span>⭐ {a.maxScore} баллов</span>
                        </div>
                      </div>
                      <span className="text-gray-500 group-hover:text-white transition-colors text-xl">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ==================== ASSIGNMENT DETAIL VIEW (Student) ====================
function AssignmentDetailView({ assignment, user, data, setData, onBack }: {
  assignment: Assignment;
  user: User;
  data: ReturnType<typeof loadData>;
  setData: (d: ReturnType<typeof loadData>) => void;
  onBack: () => void;
}) {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const existingSubmission = data.submissions.find(
    s => s.assignmentId === assignment.id && s.studentId === user.id
  );

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert('Прикрепите хотя бы один файл');
      return;
    }
    setSubmitting(true);
    const submission: Submission = {
      id: existingSubmission?.id || generateId(),
      assignmentId: assignment.id,
      studentId: user.id,
      studentName: user.fullName,
      studentNumber: user.studentNumber,
      submittedAt: Date.now(),
      files,
      comment,
      status: 'submitted',
      score: null,
      teacherComment: '',
      reviewedAt: null,
    };
    const newData = addSubmission(data, submission);
    setData(newData);
    setSubmitting(false);
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
        ← Назад к заданиям
      </button>

      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {assignment.subject}
          </span>
          <span className="text-xs text-gray-400">от {assignment.teacherName}</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{assignment.title}</h1>
        <p className="text-gray-300 whitespace-pre-wrap">{assignment.description}</p>
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-400 flex-wrap">
          <span>📅 Срок: {formatDueDate(assignment.dueDate)}</span>
          <span>⭐ Макс. баллов: {assignment.maxScore}</span>
          {isOverdue(assignment.dueDate) && <span className="text-red-400">⚠️ Просрочено</span>}
        </div>

        {assignment.attachments.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Прикреплённые файлы:</p>
            <div className="space-y-2">
              {assignment.attachments.map((file, i) => (
                <a
                  key={i}
                  href={file.dataUrl}
                  download={file.name}
                  className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
                >
                  <span>{file.type.includes('image') ? '🖼️' : '📄'}</span>
                  <span className="text-sm text-blue-300">{file.name}</span>
                  <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submission section */}
      {existingSubmission && existingSubmission.status === 'reviewed' ? (
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 animate-slide-up">
          <h2 className="text-lg font-bold text-green-300 mb-3">✅ Проверено</h2>
          {existingSubmission.score !== null && (
            <div className="text-3xl font-bold text-white mb-2">
              {existingSubmission.score} / {assignment.maxScore}
              <span className="text-sm text-gray-400 ml-2">баллов</span>
            </div>
          )}
          {existingSubmission.teacherComment && (
            <div className="mt-3 bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Комментарий преподавателя:</p>
              <p className="text-gray-200">{existingSubmission.teacherComment}</p>
            </div>
          )}
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Ваши файлы:</p>
            {existingSubmission.files.map((f, i) => (
              <a key={i} href={f.dataUrl} download={f.name} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 mb-1">
                📎 {f.name}
              </a>
            ))}
          </div>
        </div>
      ) : existingSubmission && existingSubmission.status === 'returned' ? (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6 animate-slide-up">
          <h2 className="text-lg font-bold text-orange-300 mb-3">↩️ Возвращено на доработку</h2>
          {existingSubmission.teacherComment && (
            <div className="mt-2 bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Комментарий:</p>
              <p className="text-gray-200">{existingSubmission.teacherComment}</p>
            </div>
          )}
          <p className="text-sm text-gray-400 mt-3">Вы можете отправить работу заново ниже.</p>
        </div>
      ) : existingSubmission && existingSubmission.status === 'submitted' ? (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 animate-slide-up">
          <h2 className="text-lg font-bold text-blue-300 mb-3">⏳ Отправлено на проверку</h2>
          <p className="text-sm text-gray-400">Отправлено: {formatDate(existingSubmission.submittedAt)}</p>
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2">Прикреплённые файлы:</p>
            {existingSubmission.files.map((f, i) => (
              <a key={i} href={f.dataUrl} download={f.name} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 mb-1">
                📎 {f.name}
              </a>
            ))}
          </div>
          {existingSubmission.comment && (
            <div className="mt-3 bg-white/5 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Ваш комментарий:</p>
              <p className="text-sm text-gray-200">{existingSubmission.comment}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 animate-slide-up">
          <h2 className="text-lg font-bold text-white mb-4">📤 Отправить решение</h2>
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Комментарий (необязательно)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Напишите комментарий к работе..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none h-20"
            />
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Прикрепите файлы</label>
            <FileUpload files={files} onFilesChange={setFiles} />
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || files.length === 0}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {submitting ? '⏳ Отправка...' : '📤 Отправить работу'}
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== TEACHER PANEL ====================
function TeacherPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [data, setData] = useState(loadData());
  const [view, setView] = useState<'assignments' | 'create' | 'review'>('assignments');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  const [attachFiles, setAttachFiles] = useState<FileAttachment[]>([]);

  const myAssignments = data.assignments.filter(a => a.teacherId === user.id);

  const handleCreate = () => {
    if (!title || !description || !dueDate) {
      alert('Заполните все обязательные поля');
      return;
    }
    const assignment: Assignment = {
      id: generateId(),
      teacherId: user.id,
      teacherName: user.fullName,
      title,
      description,
      subject,
      dueDate,
      createdAt: Date.now(),
      maxScore,
      attachments: attachFiles,
    };
    const newData = addAssignment(data, assignment);
    setData(newData);
    setTitle('');
    setDescription('');
    setDueDate('');
    setMaxScore(10);
    setAttachFiles([]);
    setView('assignments');
  };

  const handleDeleteAssignment = (id: string) => {
    if (confirm('Удалить задание и все связанные сдачи?')) {
      const newData = deleteAssignment(data, id);
      setData(newData);
    }
  };

  const getSubmissionStats = (assignmentId: string) => {
    const subs = data.submissions.filter(s => s.assignmentId === assignmentId);
    const totalStudents = data.users.filter(u => u.role === 'student').length;
    const submitted = subs.filter(s => s.status === 'submitted' || s.status === 'reviewed' || s.status === 'returned').length;
    const reviewed = subs.filter(s => s.status === 'reviewed').length;
    return { total: totalStudents, submitted, reviewed, notSubmitted: totalStudents - submitted };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{user.avatar}</span>
            <div>
              <p className="text-white font-semibold text-sm">{user.fullName}</p>
              <p className="text-gray-400 text-xs">Преподаватель</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            🚪
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setView('assignments'); setSelectedAssignment(null); setSelectedSubmission(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              view === 'assignments' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            📋 Мои задания
          </button>
          <button
            onClick={() => setView('create')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              view === 'create' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            ➕ Создать задание
          </button>
        </div>

        {/* Create assignment */}
        {view === 'create' && (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-6">📝 Новое домашнее задание</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Предмет</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                >
                  {SUBJECTS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Макс. баллов</label>
                <input
                  type="number"
                  value={maxScore}
                  onChange={e => setMaxScore(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Название *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Например: Решение уравнений §5"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Описание задания *</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Подробное описание задания..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Срок сдачи *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Материалы к заданию</label>
                <FileUpload files={attachFiles} onFilesChange={setAttachFiles} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg"
              >
                ✅ Опубликовать задание
              </button>
              <button
                onClick={() => setView('assignments')}
                className="px-6 py-3 rounded-xl font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-all"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Assignments list */}
        {view === 'assignments' && !selectedAssignment && (
          <div className="animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{myAssignments.length}</p>
                <p className="text-xs text-gray-400">Заданий</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-blue-400">
                  {data.users.filter(u => u.role === 'student').length}
                </p>
                <p className="text-xs text-gray-400">Учеников</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-400">
                  {data.submissions.filter(s => myAssignments.some(a => a.id === s.assignmentId)).length}
                </p>
                <p className="text-xs text-gray-400">Сдано работ</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-yellow-400">
                  {data.submissions.filter(s => myAssignments.some(a => a.id === s.assignmentId) && s.status === 'submitted').length}
                </p>
                <p className="text-xs text-gray-400">Ожидают проверки</p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-white mb-4">Мои задания</h2>
            {myAssignments.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">📝</div>
                <p>Вы ещё не создали заданий</p>
                <button onClick={() => setView('create')} className="mt-3 text-purple-400 hover:text-purple-300 text-sm">
                  Создать первое задание →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myAssignments.map(a => {
                  const stats = getSubmissionStats(a.id);
                  return (
                    <div
                      key={a.id}
                      className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedAssignment(a)}>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {a.subject}
                            </span>
                            <span className="text-xs text-gray-500">до {formatDueDate(a.dueDate)}</span>
                          </div>
                          <h3 className="text-white font-semibold">{a.title}</h3>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                            <span className="text-green-400">✅ Сдали: {stats.submitted}/{stats.total}</span>
                            <span className="text-yellow-400">⏳ На проверке: {stats.submitted - stats.reviewed}</span>
                            <span className="text-red-400">❌ Не сдали: {stats.notSubmitted}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedAssignment(a)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            title="Подробнее"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(a.id)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Assignment detail (teacher) */}
        {view === 'assignments' && selectedAssignment && !selectedSubmission && (
          <AssignmentReviewView
            assignment={selectedAssignment}
            data={data}
            setData={setData}
            onBack={() => setSelectedAssignment(null)}
            onSelectSubmission={setSelectedSubmission}
          />
        )}

        {/* Submission review */}
        {view === 'assignments' && selectedAssignment && selectedSubmission && (
          <SubmissionReviewView
            assignment={selectedAssignment}
            submission={selectedSubmission}
            data={data}
            setData={setData}
            onBack={() => setSelectedSubmission(null)}
          />
        )}
      </main>
    </div>
  );
}

// ==================== ASSIGNMENT REVIEW VIEW (Teacher) ====================
function AssignmentReviewView({ assignment, data, setData, onBack, onSelectSubmission }: {
  assignment: Assignment;
  data: ReturnType<typeof loadData>;
  setData: (d: ReturnType<typeof loadData>) => void;
  onBack: () => void;
  onSelectSubmission: (s: Submission) => void;
}) {
  const students = data.users.filter(u => u.role === 'student');
  const submissions = data.submissions.filter(s => s.assignmentId === assignment.id);

  const getStudentSubmission = (studentId: string): Submission | undefined => {
    return submissions.find(s => s.studentId === studentId);
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
        ← Назад
      </button>

      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {assignment.subject}
          </span>
          <span className="text-xs text-gray-400">⭐ {assignment.maxScore} баллов</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{assignment.title}</h1>
        <p className="text-gray-300 whitespace-pre-wrap">{assignment.description}</p>
        <p className="text-sm text-gray-400 mt-3">📅 Срок: {formatDueDate(assignment.dueDate)}</p>
      </div>

      <h2 className="text-lg font-bold text-white mb-4">
        👥 Ученики ({submissions.length}/{students.length} сдали)
      </h2>

      {students.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>Пока нет зарегистрированных учеников</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map(student => {
            const sub = getStudentSubmission(student.id);
            return (
              <div
                key={student.id}
                className={`bg-white/5 backdrop-blur border rounded-xl p-4 flex items-center justify-between transition-all ${
                  sub ? 'border-white/10 hover:bg-white/8' : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{student.avatar}</span>
                  <div>
                    <p className="text-white font-medium text-sm">{student.fullName}</p>
                    <p className="text-gray-500 text-xs">№{student.studentNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sub ? (
                    <>
                      {sub.status === 'submitted' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">На проверке</span>
                      )}
                      {sub.status === 'reviewed' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">
                          {sub.score}/{assignment.maxScore}
                        </span>
                      )}
                      {sub.status === 'returned' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">Возвращено</span>
                      )}
                      <button
                        onClick={() => onSelectSubmission(sub)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-medium hover:bg-purple-600/30 transition-all"
                      >
                        {sub.status === 'submitted' ? 'Проверить' : 'Открыть'}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">Не сдал(а)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== SUBMISSION REVIEW VIEW (Teacher) ====================
function SubmissionReviewView({ assignment, submission, data, setData, onBack }: {
  assignment: Assignment;
  submission: Submission;
  data: ReturnType<typeof loadData>;
  setData: (d: ReturnType<typeof loadData>) => void;
  onBack: () => void;
}) {
  const [score, setScore] = useState(submission.score?.toString() || '');
  const [teacherComment, setTeacherComment] = useState(submission.teacherComment || '');

  const handleReview = (status: 'reviewed' | 'returned') => {
    if (status === 'reviewed' && !score) {
      alert('Укажите оценку');
      return;
    }
    const newData = updateSubmission(data, submission.id, {
      status,
      score: status === 'reviewed' ? Number(score) : null,
      teacherComment,
      reviewedAt: Date.now(),
    });
    setData(newData);
    onBack();
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
        ← Назад
      </button>

      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{submission.studentName.charAt(0) === '👨' || submission.studentName.charAt(0) === '👩' ? '' : '🎓'}</span>
          <div>
            <p className="text-white font-semibold">{submission.studentName}</p>
            <p className="text-gray-400 text-xs">№{submission.studentNumber} • Отправлено: {formatDate(submission.submittedAt)}</p>
          </div>
        </div>

        {submission.comment && (
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-400 mb-1">Комментарий ученика:</p>
            <p className="text-gray-200 text-sm">{submission.comment}</p>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-400 mb-2">Прикреплённые файлы:</p>
          <div className="space-y-2">
            {submission.files.map((file, i) => (
              <div key={i} className="bg-white/5 rounded-xl overflow-hidden">
                {file.type.includes('image') ? (
                  <div>
                    <img src={file.dataUrl} alt={file.name} className="w-full max-h-64 object-contain bg-black/20" />
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{file.name}</span>
                      <a href={file.dataUrl} download={file.name} className="text-xs text-blue-400 hover:text-blue-300">
                        ⬇️ Скачать
                      </a>
                    </div>
                  </div>
                ) : (
                  <a
                    href={file.dataUrl}
                    download={file.name}
                    className="flex items-center gap-2 p-3 hover:bg-white/5 transition-colors"
                  >
                    <span>📄</span>
                    <span className="text-sm text-blue-300">{file.name}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review controls */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">📝 Проверка</h3>
        <div className="mb-4">
          <label className="text-xs text-gray-400 font-medium mb-1.5 block">
            Оценка (макс. {assignment.maxScore})
          </label>
          <input
            type="number"
            value={score}
            onChange={e => setScore(e.target.value)}
            min={0}
            max={assignment.maxScore}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
            placeholder={`0 - ${assignment.maxScore}`}
          />
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 font-medium mb-1.5 block">Комментарий</label>
          <textarea
            value={teacherComment}
            onChange={e => setTeacherComment(e.target.value)}
            placeholder="Напишите комментарий для ученика..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleReview('reviewed')}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg"
          >
            ✅ Зачесть
          </button>
          <button
            onClick={() => handleReview('returned')}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all shadow-lg"
          >
            ↩️ Вернуть
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>('auth');

  // Check session
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

  if (screen === 'auth' || !currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (currentUser.role === 'student') {
    return <StudentPanel user={currentUser} onLogout={handleLogout} />;
  }

  return <TeacherPanel user={currentUser} onLogout={handleLogout} />;
}

export default App;
