export type Role = 'student' | 'teacher';

export interface User {
  id: string;
  fullName: string;
  studentNumber: string;
  password: string;
  role: Role;
  avatar: string;
  createdAt: number;
}

export interface Assignment {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  createdAt: number;
  maxScore: number;
  attachments: FileAttachment[];
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export type SubmissionStatus = 'not_started' | 'submitted' | 'reviewed' | 'returned';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  submittedAt: number;
  files: FileAttachment[];
  comment: string;
  status: SubmissionStatus;
  score: number | null;
  teacherComment: string;
  reviewedAt: number | null;
}

export interface AppData {
  users: User[];
  assignments: Assignment[];
  submissions: Submission[];
}
