import React, { useState } from 'react';
import { Info, Settings2, BarChart3, Play, CheckCircle2, RefreshCw } from 'lucide-react';
import GraphStats from './GraphStats';
import MatrixDisplay from './MatrixDisplay';
import AlgorithmResults from './AlgorithmResults';
import AdjacencyListDisplay from './AdjacencyListDisplay';

const Sidebar = ({ 
  nodes, 
  edges, 
  isDirected, 
  analysis, 
  solutions, 
  highlightedEdges,
  dijkstraResult, 
  dfsResult, 
  bfsResult, 
  floydResult,
  onRunAlgo, 
  onClearDijkstra, 
  onClearDFS, 
  onClearBFS, 
  onAnalyze, 
  onHighlightPath,
  activePathType,
  onShowColoring,
  isColoringActive
}) => {
  const [dijkstraStart, setDijkstraStart] = useState('');
  const [dijkstraEnd, setDijkstraEnd] = useState('');
  const [dfsStart, setDfsStart] = useState('');
  const [bfsStart, setBfsStart] = useState('');

  const academicInfo = "Цей вебзастосунок розробив Кравчук Андрій, студент групи ПМІ-34с Факультету прикладної математики та інформатики ЛНУ ім. І. Франка для курсової роботи.";

  const handleSelectChange = (setter, clearFn, val) => {
    setter(val);
    if (clearFn) clearFn(); 
  };

  return (
    <div className="flex flex-col h-full bg-white border-l-2 border-slate-100 shadow-none">
      <div className="p-6 border-b border-slate-200 bg-slate-50/30 flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
          Аналіз графів
        </h2>
        <div className="relative group">
          <div className="p-2 text-slate-400 hover:text-slate-900 transition-colors cursor-help">
            <Info size={24} />
          </div>
          <div className="absolute right-0 top-full mt-2 w-72 p-5 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 leading-relaxed shadow-xl">
            <div className="flex gap-2 mb-2 text-blue-400 font-black uppercase text-xs">
              <CheckCircle2 size={14} /> Про проєкт
            </div>
            {academicInfo}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pl-8 pr-12 py-2">
        <section>
          <div className="flex items-center justify-between py-8 border-b border-slate-100">
            <div className="flex items-center gap-3 text-slate-900">
              <BarChart3 size={24} className="text-slate-800" />
              <h3 className="font-black text-lg uppercase tracking-wider">Характеристики</h3>
            </div>
            
            <button 
              onClick={onAnalyze}
              disabled={nodes.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-xs rounded-md font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 shadow-sm"
            >
              <RefreshCw size={14} className={analysis ? "" : "animate-spin"} />
              Аналізувати
            </button>
          </div>

          {!analysis ? (
            <div className="py-24 text-center">
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest italic text-center">
                Дані відсутні. Намалюйте граф та натисніть кнопку "Аналізувати".
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 animate-in fade-in duration-500">
              <div className="py-6">
                <MatrixDisplay 
                  adjMatrix={analysis.adjacency_matrix} 
                  incMatrix={analysis.incidence_matrix} 
                  nodes={analysis.nodesSnapshot || nodes} 
                  edges={analysis.edgesSnapshot || edges} 
                  isDirected={isDirected} 
                />
              </div>
              <div className="py-2">
                <AdjacencyListDisplay data={analysis.adjacency_list} />
              </div>
              <div className="py-8">
                <GraphStats 
                  analysis={analysis} 
                  solutions={solutions} 
                  isDirected={isDirected} 
                  onHighlightPath={onHighlightPath}
                  onShowColoring={onShowColoring}
                  isColoringActive={isColoringActive}
                  highlightedEdges={highlightedEdges}
                  activePathType={activePathType}
                />
              </div>
            </div>
          )}
        </section>

        <div className="h-4 -mx-12 bg-slate-50 border-y border-slate-100" />

        <section className="py-10 pb-20">
          <div className="flex items-center gap-3 mb-10 text-slate-900">
            <Settings2 size={24} />
            <h3 className="font-black text-lg uppercase tracking-wider">Алгоритми</h3>
          </div>

          <div className="divide-y-2 divide-slate-50">

            <div className="py-10 first:pt-0">
              <h4 className="font-black text-slate-800 text-base uppercase tracking-widest mb-6">
                Алгоритм Дейкстри
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Початкова вершина</label>
                  <select 
                    className="bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-slate-900 transition-all cursor-pointer"
                    value={dijkstraStart}
                    onChange={(e) => handleSelectChange(setDijkstraStart, onClearDijkstra, e.target.value)}
                  >
                    <option value="">—</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Кінцева вершина</label>
                  <select 
                    className="bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-slate-900 transition-all cursor-pointer"
                    value={dijkstraEnd}
                    onChange={(e) => handleSelectChange(setDijkstraEnd, onClearDijkstra, e.target.value)}
                  >
                    <option value="">—</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                </div>
              </div>
              <button 
                disabled={!dijkstraStart || !dijkstraEnd}
                onClick={() => onRunAlgo('dijkstra', { start_node: dijkstraStart, end_node: dijkstraEnd })}
                className="w-full py-4 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-300 transition-all"
              >
                ОБЧИСЛИТИ НАЙКОРОТШИЙ ШЛЯХ
              </button>
              <AlgorithmResults result={dijkstraResult} type="dijkstra" />
            </div>
            <div className="py-10">
              <h4 className="font-black text-slate-800 text-base uppercase tracking-widest mb-6">
                Алгоритм Флойда-Воршелла
              </h4>
              <button 
                disabled={nodes.length === 0}
                onClick={() => onRunAlgo('floyd')}
                className="w-full py-4 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md disabled:bg-slate-100 disabled:text-slate-300"
              >
                ПОБУДУВАТИ МАТРИЦІ ШЛЯХІВ
              </button>
              <AlgorithmResults 
                result={floydResult} 
                type="floyd" 
                onHighlightPath={onHighlightPath} 
                nodes={nodes} 
                edges={edges}
                isDirected={isDirected}
              />
            </div>

            <div className="py-10">
              <h4 className="font-black text-slate-800 text-base uppercase tracking-widest mb-6">
                Пошук у глибину (DFS)
              </h4>
              <div className="flex flex-col gap-2 mb-5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Початкова вершина</label>
                <select 
                  className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-slate-900 transition-all cursor-pointer"
                  value={dfsStart}
                  onChange={(e) => handleSelectChange(setDfsStart, onClearDFS, e.target.value)}
                >
                  <option value="">ВИБЕРІТЬ ВЕРШИНУ</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>
              <button 
                disabled={!dfsStart}
                onClick={() => onRunAlgo('dfs', { start_node: dfsStart })}
                className="w-full py-4 bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-800 disabled:bg-slate-100 disabled:text-slate-300 transition-all"
              >
                ЗАПУСТИТИ DFS ОБХІД
              </button>
              <AlgorithmResults result={dfsResult} type="dfs" />
            </div>

            <div className="py-10 last:pb-0">
              <h4 className="font-black text-slate-800 text-base uppercase tracking-widest mb-6">
                Пошук у ширину (BFS)
              </h4>
              <div className="flex flex-col gap-2 mb-5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Початкова вершина</label>
                <select 
                  className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-slate-900 transition-all cursor-pointer"
                  value={bfsStart}
                  onChange={(e) => handleSelectChange(setBfsStart, onClearBFS, e.target.value)}
                >
                  <option value="">ВИБЕРІТЬ ВЕРШИНУ</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>
              <button 
                disabled={!bfsStart}
                onClick={() => onRunAlgo('bfs', { start_node: bfsStart })}
                className="w-full py-4 bg-amber-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-amber-700 disabled:bg-slate-100 disabled:text-slate-300 transition-all"
              >
                ЗАПУСТИТИ BFS ОБХІД
              </button>
              <AlgorithmResults result={bfsResult} type="bfs" />
            </div>

          </div>
        </section>
      </div>
    </div>
  );
};

export default Sidebar;