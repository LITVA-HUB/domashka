import { useState, useEffect } from 'react';
import { User, Assignment, Submission, FileAttachment, Toast, AppData } from '../types';
import { SUBJECTS, SUBJECT_ICONS } from '../types';
import { loadData, addSubmission, generateId, formatDate, formatDueDate, isOverdue, daysUntilDue } from '../store';
import { FileUpload } from './shared';
import {
  BookOpen, Upload, CheckCircle, Clock, AlertCircle, Search, LogOut,
  ArrowLeft, Download, GraduationCap, Calendar, Star, TrendingUp, Filter,
  FileText, Image as ImageIcon,
} from 'lucide-react';

export function StudentPanel({ user, onLogout, addToast }: { user: User; onLogout: () => void; addToast: (type: Toast['type'], msg: string) => void }) {
  const [data, setData] = useState<AppData>(loadData());
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [view, setView] = useState<'assignments' | 'grades'>('assignments');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Re-read data when switching views
  useEffect(() => {
    setData(loadData());
  }, [view, selectedAssignment]);

  const mySubmissions = data.submissions.filter(s => s.studentId === user.id);
  const assignments = data.assignments;

  const getSubmission = (assignmentId: string): Submission | undefined =>
    data.submissions.find(s => s.assignmentId === assignmentId && s.studentId === user.id);

  const totalScore = mySubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
  const maxPossibleScore = assignments.reduce((sum, a) => sum + a.maxScore, 0);

  // Filter assignments
  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !filterSubject || a.subject === filterSubject;
    const sub = getSubmission(a.id);
    let matchesStatus = true;
    if (filterStatus === 'not_started') matchesStatus = !sub;
    else if (filterStatus === 'submitted') matchesStatus = sub?.status === 'submitted';
    else if (filterStatus === 'reviewed') matchesStatus = sub?.status === 'reviewed';
    else if (filterStatus === 'returned') matchesStatus = sub?.status === 'returned';
    else if (filterStatus === 'overdue') matchesStatus = !sub && isOverdue(a.dueDate);
    return matchesSearch && matchesSubject && matchesStatus;
  });

  const getStatusBadge = (assignment: Assignment) => {
    const sub = getSubmission(assignment.id);
    if (!sub) {
      if (isOverdue(assignment.dueDate)) return <span className="px-2 py-0.5 rounded-full text-[11px] bg-red-500/20 text-red-300 border border-red-500/30 font-medium">Просрочено</span>;
      const days = daysUntilDue(assignment.dueDate);
      if (days <= 2 && days >= 0) return <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">Скоро срок</span>;
      return <span className="px-2 py-0.5 rounded-full text-[11px] bg-gray-500/20 text-gray-400 border border-gray-500/30">Не начато</span>;
    }
    switch (sub.status) {
      case 'submitted': return <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">На проверке</span>;
      case 'reviewed': return <span className="px-2 py-0.5 rounded-full text-[11px] bg-green-500/20 text-green-300 border border-green-500/30 font-medium">✓ {sub.score}/{assignment.maxScore}</span>;
      case 'returned': return <span className="px-2 py-0.5 rounded-full text-[11px] bg-orange-500/20 text-orange-300 border border-orange-500/30 font-medium">Возвращено</span>;
      default: return null;
    }
  };

  if (selectedAssignment) {
    return <AssignmentDetail assignment={selectedAssignment} user={user} data={data} setData={setData} onBack={() => setSelectedAssignment(null)} addToast={addToast} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      {/* Header */}
      <header className="bg-white/[0.03] backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-xl">
              {user.avatar}
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-semibold text-sm leading-tight">{user.fullName}</p>
              <p className="text-gray-500 text-xs">Ученик • №{user.studentNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl px-3 py-1.5">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white font-bold">{totalScore}</span>
              <span className="text-xs text-gray-400">/ {maxPossibleScore}</span>
            </div>
            <button onClick={() => setShowLogoutConfirm(true)} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all" title="Выйти">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setView('assignments')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${view === 'assignments' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
            <BookOpen className="w-4 h-4" /> Задания
          </button>
          <button onClick={() => setView('grades')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${view === 'grades' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
            <TrendingUp className="w-4 h-4" /> Журнал оценок
          </button>
        </div>

        {view === 'grades' ? (
          <GradesView data={data} user={user} assignments={assignments} submissions={mySubmissions} />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-gray-400">Всего</p>
                </div>
                <p className="text-2xl font-bold text-white">{assignments.length}</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-gray-400">Сдано</p>
                </div>
                <p className="text-2xl font-bold text-green-400">{mySubmissions.filter(s => s.status !== 'returned').length}</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-gray-400">На проверке</p>
                </div>
                <p className="text-2xl font-bold text-blue-400">{mySubmissions.filter(s => s.status === 'submitted').length}</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <p className="text-xs text-gray-400">Баллы</p>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{totalScore}</p>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Поиск заданий..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-gray-300 text-sm focus:outline-none focus:border-blue-500/50">
                <option value="" className="bg-slate-900">Все предметы</option>
                {SUBJECTS.map(s => <option key={s} value={s} className="bg-slate-900">{SUBJECT_ICONS[s] || '📚'} {s}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-gray-300 text-sm focus:outline-none focus:border-blue-500/50">
                <option value="" className="bg-slate-900">Все статусы</option>
                <option value="not_started" className="bg-slate-900">Не начато</option>
                <option value="submitted" className="bg-slate-900">На проверке</option>
                <option value="reviewed" className="bg-slate-900">Проверено</option>
                <option value="returned" className="bg-slate-900">Возвращено</option>
                <option value="overdue" className="bg-slate-900">Просрочено</option>
              </select>
            </div>

            {/* Assignments list */}
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p>{assignments.length === 0 ? 'Пока нет заданий' : 'Ничего не найдено'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssignments.map(a => (
                  <div key={a.id} onClick={() => setSelectedAssignment(a)}
                    className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-xl p-4 hover:bg-white/[0.06] cursor-pointer transition-all hover:border-white/20 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 font-medium">
                            {SUBJECT_ICONS[a.subject] || '📚'} {a.subject}
                          </span>
                          {getStatusBadge(a)}
                        </div>
                        <h3 className="text-white font-semibold group-hover:text-blue-300 transition-colors">{a.title}</h3>
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{a.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                          <span>👨‍🏫 {a.teacherName}</span>
                          <span>📅 до {formatDueDate(a.dueDate)}</span>
                          <span>⭐ {a.maxScore} б.</span>
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:rotate-180 transition-all rotate-0 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-white mb-2">Выйти из аккаунта?</h3>
            <p className="text-gray-400 text-sm mb-6">Вы уверены, что хотите выйти?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-all">
                Отмена
              </button>
              <button onClick={onLogout} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all">
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== GRADES VIEW ====================
function GradesView({ data, user, assignments, submissions }: { data: AppData; user: User; assignments: Assignment[]; submissions: Submission[] }) {
  const reviewedSubmissions = submissions.filter(s => s.status === 'reviewed');
  const totalScore = reviewedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
  const maxPossible = reviewedSubmissions.reduce((sum, s) => {
    const a = assignments.find(a => a.id === s.assignmentId);
    return sum + (a?.maxScore || 0);
  }, 0);
  const percentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

  // Group by subject
  const bySubject: Record<string, { score: number; max: number; count: number }> = {};
  reviewedSubmissions.forEach(s => {
    const a = assignments.find(a => a.id === s.assignmentId);
    if (!a) return;
    if (!bySubject[a.subject]) bySubject[a.subject] = { score: 0, max: 0, count: 0 };
    bySubject[a.subject].score += s.score || 0;
    bySubject[a.subject].max += a.maxScore;
    bySubject[a.subject].count += 1;
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Overall stats */}
      <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Общая статистика</h2>
          <span className="text-3xl font-black text-blue-400">{percentage}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{totalScore}</p>
            <p className="text-xs text-gray-400">Баллов</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{reviewedSubmissions.length}</p>
            <p className="text-xs text-gray-400">Проверено</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{maxPossible}</p>
            <p className="text-xs text-gray-400">Макс. возможно</p>
          </div>
        </div>
      </div>

      {/* By subject */}
      {Object.keys(bySubject).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">По предметам</h3>
          <div className="space-y-2">
            {Object.entries(bySubject).map(([subject, stats]) => {
              const pct = stats.max > 0 ? Math.round((stats.score / stats.max) * 100) : 0;
              return (
                <div key={subject} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{SUBJECT_ICONS[subject] || '📚'} {subject}</span>
                    <span className="text-sm font-bold text-white">{stats.score}/{stats.max}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stats.count} заданий • {pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All grades */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Все оценки</h3>
        {reviewedSubmissions.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>Пока нет проверенных работ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reviewedSubmissions.sort((a, b) => (b.reviewedAt || 0) - (a.reviewedAt || 0)).map(sub => {
              const assignment = assignments.find(a => a.id === sub.assignmentId);
              if (!assignment) return null;
              const pct = assignment.maxScore > 0 ? Math.round(((sub.score || 0) / assignment.maxScore) * 100) : 0;
              return (
                <div key={sub.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{assignment.title}</p>
                    <p className="text-xs text-gray-500">{SUBJECT_ICONS[assignment.subject] || '📚'} {assignment.subject} • {formatDate(sub.reviewedAt || 0)}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className={`text-lg font-bold ${pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {sub.score}/{assignment.maxScore}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== ASSIGNMENT DETAIL ====================
function AssignmentDetail({ assignment, user, data, setData, onBack, addToast }: {
  assignment: Assignment; user: User; data: AppData; setData: (d: AppData) => void;
  onBack: () => void; addToast: (type: Toast['type'], msg: string) => void;
}) {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const existingSubmission = data.submissions.find(s => s.assignmentId === assignment.id && s.studentId === user.id);

  const handleSubmit = () => {
    if (files.length === 0) { addToast('error', 'Прикрепите хотя бы один файл'); return; }
    setSubmitting(true);
    const submission: Submission = {
      id: existingSubmission?.id || generateId(),
      assignmentId: assignment.id, studentId: user.id, studentName: user.fullName, studentNumber: user.studentNumber,
      submittedAt: Date.now(), files, comment, status: 'submitted', score: null, teacherComment: '', reviewedAt: null,
    };
    const newData = addSubmission(data, submission);
    setData(newData);
    setSubmitting(false);
    addToast('success', 'Работа отправлена на проверку!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      <header className="bg-white/[0.03] backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{assignment.title}</p>
            <p className="text-gray-500 text-xs">{SUBJECT_ICONS[assignment.subject] || '📚'} {assignment.subject}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
        <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 font-medium">
              {SUBJECT_ICONS[assignment.subject] || '📚'} {assignment.subject}
            </span>
            <span className="text-xs text-gray-400">от {assignment.teacherName}</span>
            {isOverdue(assignment.dueDate) && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/20 font-medium">Просрочено</span>}
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">{assignment.title}</h1>
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDueDate(assignment.dueDate)}</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400" /> {assignment.maxScore} баллов</span>
          </div>

          {assignment.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-gray-400 mb-2">Материалы:</p>
              <div className="space-y-2">
                {assignment.attachments.map((file, i) => (
                  <a key={i} href={file.dataUrl} download={file.name}
                    className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5 hover:bg-white/10 transition-colors group">
                    {file.type.includes('image') ? <ImageIcon className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-gray-400" />}
                    <span className="text-sm text-blue-300 flex-1 truncate">{file.name}</span>
                    <Download className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submission section */}
        {existingSubmission && existingSubmission.status === 'reviewed' ? (
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-bold text-green-300">Проверено</h2>
            </div>
            {existingSubmission.score !== null && (
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-4xl font-black text-white">{existingSubmission.score}<span className="text-lg text-gray-400"> / {assignment.maxScore}</span></p>
                <p className="text-xs text-gray-400 mt-1">баллов</p>
              </div>
            )}
            {existingSubmission.teacherComment && (
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-400 mb-1">Комментарий преподавателя:</p>
                <p className="text-gray-200 text-sm">{existingSubmission.teacherComment}</p>
              </div>
            )}
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400 mb-2">Ваши файлы:</p>
              {existingSubmission.files.map((f, i) => (
                <a key={i} href={f.dataUrl} download={f.name} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 mb-1">
                  <Download className="w-3 h-3" /> {f.name}
                </a>
              ))}
            </div>
          </div>
        ) : existingSubmission && existingSubmission.status === 'returned' ? (
          <div className="space-y-4">
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <h2 className="text-lg font-bold text-orange-300">Возвращено на доработку</h2>
              </div>
              {existingSubmission.teacherComment && (
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Комментарий:</p>
                  <p className="text-gray-200 text-sm">{existingSubmission.teacherComment}</p>
                </div>
              )}
            </div>
            <SubmitForm files={files} setFiles={setFiles} comment={comment} setComment={setComment} onSubmit={handleSubmit} submitting={submitting} />
          </div>
        ) : existingSubmission && existingSubmission.status === 'submitted' ? (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-blue-300">Отправлено на проверку</h2>
            </div>
            <p className="text-sm text-gray-400 mb-3">Отправлено: {formatDate(existingSubmission.submittedAt)}</p>
            {existingSubmission.comment && (
              <div className="bg-white/5 rounded-xl p-3 mb-3">
                <p className="text-xs text-gray-400 mb-1">Ваш комментарий:</p>
                <p className="text-sm text-gray-200">{existingSubmission.comment}</p>
              </div>
            )}
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400 mb-2">Прикреплённые файлы:</p>
              {existingSubmission.files.map((f, i) => (
                <a key={i} href={f.dataUrl} download={f.name} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 mb-1">
                  <Download className="w-3 h-3" /> {f.name}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <SubmitForm files={files} setFiles={setFiles} comment={comment} setComment={setComment} onSubmit={handleSubmit} submitting={submitting} />
        )}
      </main>
    </div>
  );
}

function SubmitForm({ files, setFiles, comment, setComment, onSubmit, submitting }: {
  files: FileAttachment[]; setFiles: (f: FileAttachment[]) => void;
  comment: string; setComment: (c: string) => void;
  onSubmit: () => void; submitting: boolean;
}) {
  return (
    <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-2xl p-6 animate-slide-up">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Upload className="w-5 h-5" /> Отправить решение</h2>
      <div className="mb-4">
        <label className="text-xs text-gray-400 font-medium mb-1.5 block">Комментарий (необязательно)</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Напишите комментарий..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none h-20 text-sm" />
      </div>
      <div className="mb-4">
        <label className="text-xs text-gray-400 font-medium mb-1.5 block">Прикрепите файлы *</label>
        <FileUpload files={files} onFilesChange={setFiles} />
      </div>
      <button onClick={onSubmit} disabled={submitting || files.length === 0}
        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/20">
        {submitting ? 'Отправка...' : 'Отправить работу'}
      </button>
    </div>
  );
}
