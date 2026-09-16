import { AppData, User, Assignment, Submission } from './types';

const STORAGE_KEY = 'hw-platform-data';

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
      return defaultData;
    }
    return JSON.parse(raw) as AppData;
  } catch {
    return defaultData;
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function addUser(data: AppData, user: User): AppData {
  const newData = { ...data, users: [...data.users, user] };
  saveData(newData);
  return newData;
}

export function addAssignment(data: AppData, assignment: Assignment): AppData {
  const newData = { ...data, assignments: [assignment, ...data.assignments] };
  saveData(newData);
  return newData;
}

export function deleteAssignment(data: AppData, assignmentId: string): AppData {
  const newData = {
    ...data,
    assignments: data.assignments.filter(a => a.id !== assignmentId),
    submissions: data.submissions.filter(s => s.assignmentId !== assignmentId),
  };
  saveData(newData);
  return newData;
}

export function addSubmission(data: AppData, submission: Submission): AppData {
  const existing = data.submissions.findIndex(
    s => s.assignmentId === submission.assignmentId && s.studentId === submission.studentId
  );
  let newSubmissions: Submission[];
  if (existing >= 0) {
    newSubmissions = [...data.submissions];
    newSubmissions[existing] = submission;
  } else {
    newSubmissions = [...data.submissions, submission];
  }
  const newData = { ...data, submissions: newSubmissions };
  saveData(newData);
  return newData;
}

export function updateSubmission(data: AppData, submissionId: string, updates: Partial<Submission>): AppData {
  const newSubmissions = data.submissions.map(s =>
    s.id === submissionId ? { ...s, ...updates } : s
  );
  const newData = { ...data, submissions: newSubmissions };
  saveData(newData);
  return newData;
}

export function authenticate(data: AppData, studentNumber: string, password: string): User | null {
  return data.users.find(u => u.studentNumber === studentNumber && u.password === password) || null;
}

export function isNumberTaken(data: AppData, studentNumber: string): boolean {
  return data.users.some(u => u.studentNumber === studentNumber);
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
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
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
