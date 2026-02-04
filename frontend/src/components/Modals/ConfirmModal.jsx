import React from 'react';

const ConfirmModal = ({ message, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 border border-slate-100 animate-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Підтвердження</h3>
        <p className="text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Ні, залишити</button>
          <button onClick={onConfirm} className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600">Так, видалити</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;