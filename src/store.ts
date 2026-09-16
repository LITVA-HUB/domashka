import { AppData, User, Assignment, Submission } from './types';

const STORAGE_KEY = 'hw-platform-data-v2';

const defaultData: AppData = {
  users: [
    {
      id: 'teacher-1',
      fullName: 'Иванова Мария Петровна',
      studentNumber: 'T001',
      password: 'teacher123',
      role: 'teacher',
      avatar: '👩‍🏫',
      createdAt: Date.now(),
    },
  ],
  assignments: [],
  submissions: [],
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveData(defaultData);
      return structuredClone(defaultData);
    }
    return JSON.parse(raw) as AppData;
  } catch {
    return structuredClone(defaultData);
  }
}

export function saveData(storeData: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storeData));
  } catch (e) {
    console.error('Save failed:', e);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function addUser(storeData: AppData, user: User): AppData {
  const newData = { ...storeData, users: [...storeData.users, user] };
  saveData(newData);
  return newData;
}

export function addAssignment(storeData: AppData, assignment: Assignment): AppData {
  const newData = { ...storeData, assignments: [assignment, ...storeData.assignments] };
  saveData(newData);
  return newData;
}

export function updateAssignment(storeData: AppData, assignmentId: string, updates: Partial<Assignment>): AppData {
  const newData = {
    ...storeData,
    assignments: storeData.assignments.map(a => a.id === assignmentId ? { ...a, ...updates } : a),
  };
  saveData(newData);
  return newData;
}

export function deleteAssignment(storeData: AppData, assignmentId: string): AppData {
  const newData = {
    ...storeData,
    assignments: storeData.assignments.filter(a => a.id !== assignmentId),
    submissions: storeData.submissions.filter(s => s.assignmentId !== assignmentId),
  };
  saveData(newData);
  return newData;
}

export function addSubmission(storeData: AppData, submission: Submission): AppData {
  const existing = storeData.submissions.findIndex(
    s => s.assignmentId === submission.assignmentId && s.studentId === submission.studentId
  );
  let newSubmissions: Submission[];
  if (existing >= 0) {
    newSubmissions = [...storeData.submissions];
    newSubmissions[existing] = submission;
  } else {
    newSubmissions = [...storeData.submissions, submission];
  }
  const newData = { ...storeData, submissions: newSubmissions };
  saveData(newData);
  return newData;
}

export function updateSubmission(storeData: AppData, submissionId: string, updates: Partial<Submission>): AppData {
  const newSubmissions = storeData.submissions.map(s =>
    s.id === submissionId ? { ...s, ...updates } : s
  );
  const newData = { ...storeData, submissions: newSubmissions };
  saveData(newData);
  return newData;
}

export function authenticate(storeData: AppData, studentNumber: string, password: string): User | null {
  const trimmed = studentNumber.trim();
  return storeData.users.find(u => u.studentNumber.trim() === trimmed && u.password === password) || null;
}

export function isNumberTaken(storeData: AppData, studentNumber: string, excludeId?: string): boolean {
  const trimmed = studentNumber.trim();
  return storeData.users.some(u => u.studentNumber.trim() === trimmed && u.id !== excludeId);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDueDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function isOverdue(dueDate: string): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate + 'T23:59:59');
  return due < new Date();
}

export function daysUntilDue(dueDate: string): number {
  if (!dueDate) return -1;
  const due = new Date(dueDate + 'T23:59:59');
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}
