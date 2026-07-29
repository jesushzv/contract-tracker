import React from 'react';
import { X } from 'lucide-react';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const SlideOver: React.FC<SlideOverProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md transform transition ease-in-out duration-300">
          <div className="h-full flex flex-col bg-white shadow-xl">
            <div className="px-4 py-6 bg-gray-50 border-b border-gray-200 sm:px-6 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative flex-1 px-4 py-6 sm:px-6 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
