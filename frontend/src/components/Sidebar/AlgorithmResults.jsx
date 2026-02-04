import React, { useState } from 'react';
import { ArrowRight, AlertCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const AlgorithmResults = ({ result, type, onHighlightPath, nodes, edges, isDirected }) => {
  if (!result) return null;

  const [currentStep, setCurrentStep] = useState(0);

  const highlightFloydPath = (startIndex, endIndex) => {
    if (!onHighlightPath || !result.steps) return;
    const finalT = result.steps[result.steps.length - 1].T;
    const finalM = result.steps[result.steps.length - 1].M;
    if (finalM[startIndex][endIndex] === "∞" || startIndex === endIndex) return;
    const pathNodeIds = [];
    const getPathNodeIds = (i, j) => {
      if (i === j) {
        pathNodeIds.push(result.node_ids[i]);
      } else if (finalT[i][j] === "—" || finalT[i][j] === 0) {
        return;
      } else {
        const k = parseInt(finalT[i][j]) - 1;
        getPathNodeIds(i, k);
        pathNodeIds.push(result.node_ids[j]);
      }
    };
    getPathNodeIds(startIndex, endIndex);
    const edgeIdsToHighlight = [];
    for (let k = 0; k < pathNodeIds.length - 1; k++) {
      const u = String(pathNodeIds[k]);
      const v = String(pathNodeIds[k + 1]);
      const edge = edges.find(e => 
        (String(e.from) === u && String(e.to) === v) ||
        (!isDirected && String(e.from) === v && String(e.to) === u)
      );
      if (edge) edgeIdsToHighlight.push(edge.id);
    }
    onHighlightPath([], edgeIdsToHighlight, 'floyd');
  };

  const FloydMatrix = ({ data, labels, title, onCellClick }) => (
    <div className="mt-4">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">{title}</div>
      <div className="overflow-x-auto border-2 border-slate-100 rounded-xl">
        <table className="w-full text-center border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-100">
              <th className="p-2 border-r border-slate-100 bg-slate-100/50 text-slate-400 italic">i \ j</th>
              {labels.map((l, idx) => (
                <th key={idx} className="p-2 border-r border-slate-100 last:border-0 font-black text-slate-900">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="p-2 bg-slate-50 border-r border-slate-100 font-black text-slate-900">{labels[i]}</td>
                {row.map((val, j) => (
                  <td 
                    key={j} 
                    onClick={() => onCellClick && i !== j && onCellClick(i, j)}
                    className={`p-2 border-r border-slate-100 last:border-0 font-mono transition-all ${
                      i !== j && onCellClick ? "cursor-pointer hover:bg-indigo-50 hover:text-indigo-700" : ""
                    } ${val !== "∞" && val !== "—" && i !== j ? "text-indigo-600 font-black" : "text-slate-300"}`}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {(result.error || (type === 'dijkstra' && result.success === false)) && (
        <div className="p-5 bg-rose-50 border-2 border-rose-100 text-rose-700 rounded-xl flex items-start gap-4">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-black mb-1 uppercase text-[10px] tracking-widest text-rose-500">Помилка виконання</p>
            <span className="text-sm font-bold">{result.error || "Шлях між обраними вершинами не існує."}</span>
          </div>
        </div>
      )}
      {type === 'dijkstra' && result.success && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl text-white shadow-xl shadow-slate-200">
            <div className="text-[10px] opacity-50 uppercase font-black mb-2 text-center tracking-[0.2em]">Загальна вага шляху</div>
            <div className="text-4xl font-black text-center">{result.total_weight}</div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl">
            {result.path_nodes?.map((label, idx) => (
              <React.Fragment key={idx}>
                <span className="px-3 py-1.5 bg-white border-2 border-slate-200 text-slate-900 rounded-lg font-black text-xs shadow-sm">
                  {label}
                </span>
                {idx < result.path_nodes.length - 1 && <ArrowRight size={14} className="text-slate-300" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {type === 'floyd' && result.success && (
        <div className="space-y-8 pb-10">
          <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl text-white">
            <button 
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(s => s - 1)}
              className="p-2 hover:bg-slate-800 rounded-lg disabled:opacity-20 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <div className="text-[9px] font-black uppercase tracking-widest opacity-50">Поточний крок</div>
              <div className="text-xs font-black">
                {currentStep === 0 ? "Ініціалізація (W)" : `Крок ${currentStep} (через ${result.labels[currentStep-1]})`}
              </div>
            </div>
            <button 
              disabled={currentStep === result.steps.length - 1}
              onClick={() => setCurrentStep(s => s + 1)}
              className="p-2 hover:bg-slate-800 rounded-lg disabled:opacity-20 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            <FloydMatrix 
              title={`Матриця відстаней M(${currentStep})`} 
              data={result.steps[currentStep].M} 
              labels={result.labels}
              onCellClick={highlightFloydPath} 
            />
            <div className="py-2" />
            <FloydMatrix 
              title={`Матриця предків T(${currentStep})`} 
              data={result.steps[currentStep].T} 
              labels={result.labels} 
            />
          </div>
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex gap-3">
            <Eye size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-indigo-800 font-bold leading-relaxed uppercase">
              Порада: Клікніть на будь-яку клітинку в матриці M, щоб підсвітити шлях (ребра) між вершинами на графі.
            </p>
          </div>
        </div>
      )}

      {(type === 'dfs' || type === 'bfs') && result.protocol && (
        <div className="overflow-x-auto border-2 border-slate-100 rounded-xl">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                <th className="px-3 py-4 text-center border-r border-white/10">V</th>
                <th className="px-3 py-4 text-center border-r border-white/10">№</th>
                <th className="px-3 py-4 text-center border-r border-white/10">{type === 'dfs' ? 'Стек' : 'Черга'}</th>
                <th className="px-3 py-4 text-center">Ребро</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-slate-800">
              {result.protocol.map((step, idx) => (
                <tr key={idx} className={`border-b border-slate-100 transition-colors ${step.vertex === '—' ? 'bg-slate-50/50 text-slate-400' : 'hover:bg-blue-50'}`}>
                  <td className="px-3 py-3 text-center border-r border-slate-100">{step.vertex}</td>
                  <td className="px-3 py-3 text-center border-r border-slate-100">{step.dfs_num || step.bfs_num || '—'}</td>
                  <td className="px-3 py-3 border-r border-slate-100 font-mono text-[10px]">
                    <div className="truncate max-w-[120px] mx-auto text-center">
                      {Array.isArray(step.stack || step.queue) ? (step.stack || step.queue).join(', ') : (step.stack || step.queue || '∅')}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center italic text-slate-400 text-[10px]">{step.tree_edge || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default AlgorithmResults;