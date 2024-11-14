import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onAction, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="mb-4">{children}</div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onAction}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
