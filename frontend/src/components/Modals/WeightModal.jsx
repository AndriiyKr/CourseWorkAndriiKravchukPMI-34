import React, { useState } from 'react';

const WeightModal = ({ initialValue, onSave, onClose }) => {
  const [value, setValue] = useState(initialValue || '');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSave(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Встановити вагу</h3>
        <input 
          autoFocus
          type="number" 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Наприклад: 10"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Скасувати</button>
          <button onClick={() => onSave(value)} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700">Зберегти</button>
        </div>
      </div>
    </div>
  );
};

export default WeightModal;