import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface FormModalProps {
  isOpen: boolean;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClose: () => void;
}

export function FormModal({
  isOpen,
  title,
  size = 'md',
  children,
  onClose,
}: FormModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal ${sizeClasses[size]}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
