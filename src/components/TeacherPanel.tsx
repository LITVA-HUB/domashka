import { useState, useEffect } from 'react';
import { User, Assignment, Submission, FileAttachment, Toast, AppData } from '../types';
import { SUBJECTS, SUBJECT_ICONS } from '../types';
import { loadData, generateId, addAssignment, deleteAssignment, addSubmission, updateSubmission, formatDueDate, formatDate, isOverdue, formatFileSize } from '../store';
import { FileUpload, ConfirmModal } from './shared';
import {
  BookOpen, Plus, Eye, Trash2, ArrowLeft, Download, CheckCircle, Clock,
  AlertCircle, FileText, Image as ImageIcon, LogOut, Users, Star,
  Calendar, TrendingUp, Search,
} from 'lucide-react';

export function TeacherPanel({ user, onLogout, addToast }: { user: User; onLogout: () => void; addToast: (type: Toast['type'], msg: string) => void }) {
  const [data, setData] = useState<AppData>(loadData());
  const [view, setView] = useState<'assignments' | 'create'>('assignments');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  const [attachFiles, setAttachFiles] = useState<FileAttachment[]>([]);

  // Re-read data
  useEffect(() => { setData(loadData()); }, [view, selectedAssignment, selectedSubmission]);

  const myAssignments = data.assignments.filter(a => a.teacherId === user.id);
  const students = data.users.filter(u => u.role === 'student');

  const handleCreate = () => {
    if (!title.trim() || !description.trim() || !dueDate) {
      addToast('error', 'Заполните все обязательные поля');
      return;
    }
    const assignment: Assignment = {
      id: generateId(), teacherId: user.id, teacherName: user.fullName,
      title: title.trim(), description: description.trim(), subject, dueDate,
      createdAt: Date.now(), maxScore, attachments: attachFiles,
    };
    const newData = addAssignment(data, assignment);
    setData(newData);
    setTitle(''); setDescription(''); setDueDate(''); setMaxScore(10); setAttachFiles([]);
    setView('assignments');
    addToast('success', 'Задание опубликовано!');
  };

  const handleDelete = (id: string) => {
    const newData = deleteAssignment(data, id);
    setData(newData);
    setDeleteConfirm(null);
    if (selectedAssignment?.id === id) setSelectedAssignment(null);
    addToast('info', 'Задание удалено');
  };

  const getSubmissionStats = (assignmentId: string) => {
    const subs = data.submissions.filter(s => s.assignmentId === assignmentId);
    const submitted = subs.filter(s => s.status === 'submitted' || s.status === 'reviewed' || s.status === 'returned').length;
    const reviewed = subs.filter(s => s.status === 'reviewed').length;
    return { total: students.length, submitted, reviewed, pending: submitted - reviewed, notSubmitted: students.length - submitted };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950">
      {/* Header */}
      <header className="bg-white/[0.03] backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-xl">
              {user.avatar}
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-semibold text-sm leading-tight">{user.fullName}</p>
              <p className="text-gray-500 text-xs">Преподаватель</p>
            </div>
          </div>
          <button onClick={() => setShowLogoutConfirm(true)} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => { setView('assignments'); setSelectedAssignment(null); setSelectedSubmission(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${view === 'assignments' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
            <BookOpen className="w-4 h-4" /> Мои задания
          </button>
          <button onClick={() => setView('create')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${view === 'create' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
            <Plus className="w-4 h-4" /> Создать
          </button>
        </div>

        {/* Create */}
        {view === 'create' && (
          <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-2xl p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Plus className="w-5 h-5" /> Новое задание</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Предмет</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50">
                  {SUBJECTS.map(s => <option key={s} value={s} className="bg-slate-900">{SUBJECT_ICONS[s] || '📚'} {s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Макс. баллов</label>
                <input type="number" value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} min={1} max={100}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Название *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Решение уравнений §5"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Описание *</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Подробное описание задания..."
                  rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Срок сдачи *</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Материалы к заданию</label>
                <FileUpload files={attachFiles} onFilesChange={setAttachFiles} accent="purple" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreate}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20">
                Опубликовать
              </button>
              <button onClick={() => setView('assignments')}
                className="px-6 py-3 rounded-xl font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-all">
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
              <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <p className="text-xs text-gray-400">Заданий</p>
                </div>
                <p className="text-2xl font-bold text-white">{myAssignments.length}</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-gray-400">Учеников</p>
                </div>
                <p className="text-2xl font-bold text-blue-400">{students.length}</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-gray-400">Сдано</p>
                </div>
                <p className="text-2xl font-bold text-green-400">
                  {data.submissions.filter(s => myAssignments.some(a => a.id === s.assignmentId) && s.status !== 'returned').length}
                </p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <p className="text-xs text-gray-400">На проверке</p>
                </div>
                <p className="text-2xl font-bold text-yellow-400">
                  {data.submissions.filter(s => myAssignments.some(a => a.id === s.assignmentId) && s.status === 'submitted').length}
                </p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-white mb-4">Мои задания</h2>
            {myAssignments.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">📝</div>
                <p className="mb-3">Вы ещё не создали заданий</p>
                <button onClick={() => setView('create')} className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                  Создать первое задание →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myAssignments.map(a => {
                  const stats = getSubmissionStats(a.id);
                  const progress = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0;
                  return (
                    <div key={a.id} className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-xl p-4 hover:bg-white/[0.05] transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedAssignment(a)}>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 font-medium">
                              {SUBJECT_ICONS[a.subject] || '📚'} {a.subject}
                            </span>
                            <span className="text-xs text-gray-500">до {formatDueDate(a.dueDate)}</span>
                            {isOverdue(a.dueDate) && <span className="text-xs text-red-400">• Просрочено</span>}
                          </div>
                          <h3 className="text-white font-semibold">{a.title}</h3>
                          {/* Progress bar */}
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex-1 max-w-[200px] bg-white/10 rounded-full h-1.5">
                              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                              <span className="text-green-400">✓ {stats.submitted}/{stats.total}</span>
                              {stats.pending > 0 && <span className="text-yellow-400">⏳ {stats.pending}</span>}
                              {stats.notSubmitted > 0 && <span className="text-red-400">✗ {stats.notSubmitted}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setSelectedAssignment(a)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all" title="Подробнее">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(a.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all" title="Удалить">
                            <Trash2 className="w-4 h-4" />
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

        {/* Assignment detail */}
        {view === 'assignments' && selectedAssignment && !selectedSubmission && (
          <AssignmentReview assignment={selectedAssignment} data={data} onBack={() => setSelectedAssignment(null)} onSelectSubmission={setSelectedSubmission} />
        )}

        {/* Submission review */}
        {view === 'assignments' && selectedAssignment && selectedSubmission && (
          <SubmissionReview assignment={selectedAssignment} submission={selectedSubmission} data={data} setData={setData} onBack={() => setSelectedSubmission(null)} addToast={addToast} />
        )}
      </main>

      {/* Modals */}
      <ConfirmModal open={showLogoutConfirm} title="Выйти?" message="Вы уверены, что хотите выйти из аккаунта?"
        onConfirm={onLogout} onCancel={() => setShowLogoutConfirm(false)} confirmText="Выйти" />
      <ConfirmModal open={!!deleteConfirm} title="Удалить задание?" message="Все связанные сдачи учеников будут удалены. Это действие нельзя отменить."
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} onCancel={() => setDeleteConfirm(null)} />
    </div>
  );
}

// ==================== ASSIGNMENT REVIEW ====================
function AssignmentReview({ assignment, data, onBack, onSelectSubmission }: {
  assignment: Assignment; data: AppData; onBack: () => void; onSelectSubmission: (s: Submission) => void;
}) {
  const students = data.users.filter(u => u.role === 'student');
  const submissions = data.submissions.filter(s => s.assignmentId === assignment.id);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students.filter(s =>
    !searchQuery || s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentNumber.includes(searchQuery)
  );

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>

      <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 font-medium">
            {SUBJECT_ICONS[assignment.subject] || '📚'} {assignment.subject}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" /> {assignment.maxScore} баллов</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{assignment.title}</h1>
        <p className="text-gray-300 whitespace-pre-wrap text-sm">{assignment.description}</p>
        <p className="text-sm text-gray-400 mt-3 flex items-center gap-1"><Calendar className="w-4 h-4" /> Срок: {formatDueDate(assignment.dueDate)}</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск ученика..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50 transition-all" />
      </div>

      <h2 className="text-lg font-bold text-white mb-4">
        Ученики <span className="text-gray-400 font-normal text-sm">({submissions.length}/{students.length} сдали)</span>
      </h2>

      {students.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Пока нет зарегистрированных учеников</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredStudents.map(student => {
            const sub = submissions.find(s => s.studentId === student.id);
            return (
              <div key={student.id} className={`bg-white/[0.03] backdrop-blur border rounded-xl p-4 flex items-center justify-between transition-all ${sub ? 'border-white/10 hover:bg-white/[0.05]' : 'border-red-500/15 bg-red-500/[0.03]'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                    {student.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{student.fullName}</p>
                    <p className="text-gray-500 text-xs">№{student.studentNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sub ? (
                    <>
                      {sub.status === 'submitted' && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 hidden sm:inline">На проверке</span>}
                      {sub.status === 'reviewed' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 font-bold">{sub.score}/{assignment.maxScore}</span>}
                      {sub.status === 'returned' && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 hidden sm:inline">Возвращено</span>}
                      <button onClick={() => onSelectSubmission(sub)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-medium hover:bg-purple-600/30 transition-all">
                        {sub.status === 'submitted' ? 'Проверить' : 'Открыть'}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">Не сдал(а)</span>
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

// ==================== SUBMISSION REVIEW ====================
function SubmissionReview({ assignment, submission, data, setData, onBack, addToast }: {
  assignment: Assignment; submission: Submission; data: AppData; setData: (d: AppData) => void;
  onBack: () => void; addToast: (type: Toast['type'], msg: string) => void;
}) {
  // Get latest submission data
  const currentSubmission = data.submissions.find(s => s.id === submission.id) || submission;
  const [score, setScore] = useState(currentSubmission.score?.toString() || '');
  const [teacherComment, setTeacherComment] = useState(currentSubmission.teacherComment || '');

  const handleReview = (status: 'reviewed' | 'returned') => {
    if (status === 'reviewed') {
      const scoreNum = Number(score);
      if (!score || isNaN(scoreNum)) { addToast('error', 'Укажите оценку'); return; }
      if (scoreNum < 0 || scoreNum > assignment.maxScore) { addToast('error', `Оценка должна быть от 0 до ${assignment.maxScore}`); return; }
    }
    const newData = updateSubmission(data, currentSubmission.id, {
      status, score: status === 'reviewed' ? Number(score) : null,
      teacherComment, reviewedAt: Date.now(),
    });
    setData(newData);
    addToast('success', status === 'reviewed' ? 'Работа проверена!' : 'Работа возвращена ученику');
    onBack();
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>

      <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
            🎓
          </div>
          <div>
            <p className="text-white font-semibold">{currentSubmission.studentName}</p>
            <p className="text-gray-400 text-xs">№{currentSubmission.studentNumber} • {formatDate(currentSubmission.submittedAt)}</p>
          </div>
        </div>

        {currentSubmission.comment && (
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-400 mb-1">Комментарий ученика:</p>
            <p className="text-gray-200 text-sm">{currentSubmission.comment}</p>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-400 mb-2">Прикреплённые файлы:</p>
          <div className="space-y-2">
            {currentSubmission.files.map((file, i) => (
              <div key={i} className="bg-white/5 rounded-xl overflow-hidden">
                {file.type.includes('image') ? (
                  <div>
                    <img src={file.dataUrl} alt={file.name} className="w-full max-h-64 object-contain bg-black/20" />
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{file.name}</span>
                      <a href={file.dataUrl} download={file.name} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <Download className="w-3 h-3" /> Скачать
                      </a>
                    </div>
                  </div>
                ) : (
                  <a href={file.dataUrl} download={file.name} className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-blue-300 flex-1">{file.name}</span>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review controls */}
      <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Проверка</h3>
        <div className="mb-4">
          <label className="text-xs text-gray-400 font-medium mb-1.5 block">Оценка (макс. {assignment.maxScore})</label>
          <input type="number" value={score} onChange={e => setScore(e.target.value)} min={0} max={assignment.maxScore}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50" placeholder={`0 - ${assignment.maxScore}`} />
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 font-medium mb-1.5 block">Комментарий</label>
          <textarea value={teacherComment} onChange={e => setTeacherComment(e.target.value)} placeholder="Напишите комментарий..."
            rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleReview('reviewed')}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg shadow-green-500/20">
            Зачесть
          </button>
          <button onClick={() => handleReview('returned')}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all shadow-lg shadow-orange-500/20">
            Вернуть
          </button>
        </div>
      </div>
    </div>
  );
}
