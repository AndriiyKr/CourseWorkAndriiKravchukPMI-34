import React from 'react';
import { 
  MousePointer2, 
  Circle, 
  Minus, 
  ArrowRight, 
  Type, 
  Weight, 
  Trash2,
  Eraser,
  RotateCcw 
} from 'lucide-react';

const Toolbar = ({ 
  activeTool, 
  setActiveTool, 
  isDirected, 
  setIsDirected, 
  hasEdges, 
  onClear 
}) => {
  
  const tools = [
    {
      id: 'select',
      icon: <MousePointer2 size={20} />,
      label: 'Курсор',
      description: 'Перетягування вершин та ребер'
    },
    {
      id: 'vertex',
      icon: <Circle size={20} />,
      label: 'Вершина',
      description: 'Створення нових вузлів'
    },
    {
      id: 'edge',
      icon: <Minus size={20} />,
      label: 'Ребро',
      description: 'Неорієнтований зв’язок',
      disabled: isDirected && hasEdges
    },
    {
      id: 'arc',
      icon: <ArrowRight size={20} />,
      label: 'Дуга',
      description: 'Орієнтований зв’язок',
      disabled: !isDirected && hasEdges
    },
    {
      id: 'loop',
      icon: <RotateCcw size={20} />,
      label: 'Петля',
      description: 'З’єднати вершину з собою'
    },
    {
      id: 'label',
      icon: <Type size={20} />,
      label: 'Назва',
      description: 'Змінити ім’я вершини'
    },
    {
      id: 'weight',
      icon: <Weight size={20} />,
      label: 'Вага',
      description: 'Вказати вагу ребра'
    },
    {
      id: 'eraser',
      icon: <Eraser size={20} />,
      label: 'Гумка',
      description: 'Видалити вершину або ребро'
    },
  ];

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-200 z-50">
      <div className="flex flex-col gap-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              if (tool.id === 'edge') setIsDirected(false);
              if (tool.id === 'arc') setIsDirected(true);
              setActiveTool(tool.id);
            }}
            disabled={tool.disabled}
            className={`
              relative group p-3 rounded-xl transition-all duration-200
              ${activeTool === tool.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-blue-600'}
              ${tool.disabled ? 'opacity-20 cursor-not-allowed grayscale' : 'cursor-pointer'}
            `}
            title={tool.label}
          >
            {tool.icon}
            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              {tool.label}: {tool.description}
            </span>
          </button>
        ))}
      </div>
      <div className="h-px bg-slate-200 my-1 mx-2" />
      <button
        onClick={onClear}
        className="p-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors duration-200"
        title="Очистити все"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};
export default Toolbar;