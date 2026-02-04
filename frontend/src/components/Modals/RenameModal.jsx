import React, { useState } from 'react';

const RenameModal = ({ initialValue, onSave, onClose, existingLabels }) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  const handleValidateAndSave = () => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setError('Назва не може бути порожньою');
      return;
    }
    if (existingLabels.includes(trimmedValue) && trimmedValue !== initialValue) {
      setError('Ця назва вже зайнята');
      return;
    }

    onSave(trimmedValue);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 border border-slate-100 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Перейменувати</h3>
        
        <div className="relative mb-6">
          <input 
            autoFocus
            className={`w-full px-4 py-3 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleValidateAndSave()}
          />
          {error && (
            <span className="absolute -bottom-5 left-1 text-[10px] font-bold text-red-500 uppercase tracking-wider">
              {error}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
          >
            Скасувати
          </button>
          <button 
            onClick={handleValidateAndSave} 
            className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;