import { useState, useRef } from 'react';
import { Toast } from '../types';
import { generateId } from '../store';
import { CheckCircle, AlertCircle, BookOpen, X } from 'lucide-react';

// ==================== TOAST ====================
export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`animate-slide-down rounded-xl px-4 py-3 shadow-2xl backdrop-blur-xl border flex items-start gap-3 ${
            toast.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-100' :
            toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-100' :
            'bg-blue-500/20 border-blue-500/30 text-blue-100'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {toast.type === 'info' && <BookOpen className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button onClick={() => onRemove(toast.id)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (type: Toast['type'], message: string) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  return { toasts, addToast, removeToast };
}

// ==================== FILE UPLOAD ====================
import { FileAttachment } from '../types';
import { fileToDataUrl, formatFileSize } from '../store';
import { Upload, FileText, Image as ImageIcon, X as XIcon } from 'lucide-react';

export function FileUpload({ files, onFilesChange, maxFiles = 10, accent = 'blue' }: {
  files: FileAttachment[];
  onFilesChange: (f: FileAttachment[]) => void;
  maxFiles?: number;
  accent?: 'blue' | 'purple';
}) {
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
      newFiles.push({ name: file.name, type: file.type, size: file.size, dataUrl });
    }
    onFilesChange([...files, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const accentClasses = accent === 'purple'
    ? { border: 'border-purple-400 bg-purple-500/10', btn: 'text-purple-400' }
    : { border: 'border-blue-400 bg-blue-500/10', btn: 'text-blue-400' };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          dragOver ? accentClasses.border : 'border-white/15 hover:border-white/30 bg-white/[0.02]'
        }`}
      >
        <input ref={fileInputRef} type="file" multiple onChange={e => e.target.files && handleFiles(e.target.files)} className="hidden" />
        <Upload className={`w-6 h-6 mx-auto mb-2 ${dragOver ? accentClasses.btn : 'text-gray-500'}`} />
        <p className="text-sm text-gray-300">Нажмите или перетащите файлы</p>
        <p className="text-xs text-gray-500 mt-1">Макс. 5 МБ на файл</p>
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5 group">
              {file.type.includes('image') ? <ImageIcon className="w-5 h-5 text-blue-400 flex-shrink-0" /> :
               file.type.includes('pdf') ? <FileText className="w-5 h-5 text-red-400 flex-shrink-0" /> :
               <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== CONFIRM MODAL ====================
export function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = 'Удалить', danger = true }: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-all">
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-white transition-all ${
              danger ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
