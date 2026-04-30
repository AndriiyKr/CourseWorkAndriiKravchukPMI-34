import React from 'react';
import { 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

const GraphStats = ({ 
  analysis, 
  solutions, 
  isDirected, 
  onShowColoring, 
  onHighlightPath,
  isColoringActive,
  activePathType, 
}) => {
  if (!analysis) return null;

  const { degrees, is_regular, connectivity, has_cycle, girth, cycle_path, cycle_edges } = analysis;
  const { euler, hamilton, invariants } = solutions || {};
  const isCycleActive = activePathType === 'cycle';
  const StatRow = ({ label, value, color = "text-slate-900", children }) => (
    <div className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0 px-1">
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em] mb-0.5">{label}</span>
        <span className={`text-base font-black ${color}`}>{value}</span>
      </div>
      {children}
    </div>
  );

  const isEulerActive = activePathType === 'euler';
  const isHamiltonActive = activePathType === 'hamilton';
  const renderVertexRoute = (path) => (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl mt-4">
      {path.map((label, idx) => (
        <React.Fragment key={idx}>
          <span className="px-2 py-1 bg-white border border-slate-300 text-slate-900 rounded font-black text-xs italic shadow-sm">
            {label}
          </span>
          {idx < path.length - 1 && <ArrowRight size={14} className="text-slate-400" />}
        </React.Fragment>
      ))}
    </div>
  );

  const renderEdgeRoute = (path) => {
    if (!path || path.length < 2) return null;
    const startBr = isDirected ? '(' : '{';
    const endBr = isDirected ? ')' : '}';
    const edges = [];
    for (let i = 0; i < path.length - 1; i++) {
      edges.push(`${startBr}${path[i]}, ${path[i+1]}${endBr}`);
    }

    return (
      <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl mt-4">
        {edges.map((edgeLabel, idx) => (
          <React.Fragment key={idx}>
            <span className="px-2 py-1 bg-white border border-slate-300 text-slate-900 rounded font-black text-xs italic shadow-sm">
              {edgeLabel}
            </span>
            {idx < edges.length - 1 && <ArrowRight size={14} className="text-slate-400" />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="divide-y divide-slate-200 font-sans">
      <section className="py-8 first:pt-0">
        <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em] mb-4">Загальна інформація</h3>
        <div className="space-y-0">
            <StatRow label="Тип графа" value={isDirected ? "Орієнтований" : "Неорієнтований"} />
            <StatRow label="Кількість вершин" value={degrees ? degrees.length : 0} />
            <StatRow 
                label="Наявність циклів" 
                value={has_cycle || "—"} 
                color={has_cycle === "Так" ? "text-rose-600" : "text-emerald-600"} 
            >
              {has_cycle === "Так" && cycle_path && cycle_path.length > 0 && (
                <button 
                  onClick={() => onHighlightPath(cycle_path, cycle_edges, 'cycle')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all border ${
                    isCycleActive 
                    ? "bg-rose-600 text-white border-rose-600 shadow-md" 
                    : "bg-white text-rose-600 border-rose-200 hover:bg-rose-50"
                  }`}
                >
                  {isCycleActive ? <><EyeOff size={12} /> Приховати</> : <><Eye size={12} /> Показати</>}
                </button>
              )}
            </StatRow>
            <StatRow label="Довжина найкоротшого циклу" value={girth || "—"} />
        </div>
      </section>

      <section className="py-8">
        <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em] mb-6">Степені вершин</h3>
        <div className="overflow-hidden border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-900 uppercase text-[10px] font-black border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Вершина</th>
                {isDirected ? (
                  <>
                    <th className="px-4 py-3 text-center">Напівстепінь входу</th>
                    <th className="px-4 py-3 text-center">Напівстепінь виходу</th>
                  </>
                ) : (
                  <th className="px-4 py-3 text-center">Степінь</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {degrees && degrees.map((d, i) => (
                <tr key={i} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 font-black text-slate-800">{d.label}</td>
                  {isDirected ? (
                    <>
                      <td className="px-4 py-3 text-center text-blue-700 font-mono font-black">{d.in_degree}</td>
                      <td className="px-4 py-3 text-center text-indigo-700 font-mono font-black">{d.out_degree}</td>
                    </>
                  ) : (
                    <td className="px-4 py-3 text-center font-mono text-slate-900 font-black">{d.degree}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-slate-50 flex items-center justify-between border-t border-slate-200 text-[10px] font-black uppercase">
            <span className="text-slate-500">Регулярність:</span>
            {is_regular ? (
              <span className="text-emerald-600">РЕГУЛЯРНИЙ ГРАФ</span>
            ) : (
              <span className="text-rose-500 italic opacity-70">ГРАФ НЕ Є РЕГУЛЯРНИЙ</span>
            )}
          </div>
        </div>
      </section>

      <section className="py-8">
        <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em] mb-4">Зв’язність</h3>
        <div className="space-y-0">
          <StatRow label="Кількість компонент зв’язності" value={connectivity.components_count} color="text-slate-900" />
          <StatRow label="Число вершинної зв’язності κ(G)" value={connectivity.vertex_connectivity} color="text-emerald-600" />
          <StatRow label="Число реберної зв’язності λ(G)" value={connectivity.edge_connectivity} color="text-blue-600" />
        </div>
      </section>

      <section className="py-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em]">Ейлерові структури</h3>
          {euler?.path?.length > 0 && (
            <button 
              onClick={() => onHighlightPath(euler.path, euler.edge_ids, 'euler')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded text-[10px] font-black uppercase transition-all ${
                isEulerActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isEulerActive ? <><EyeOff size={12} /> Приховати</> : <><Eye size={12} /> Показати</>}
            </button>
          )}
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase italic mb-4">{euler?.message}</p>
        {euler?.path?.length > 0 && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center text-[11px] font-black uppercase text-indigo-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
              <span>Довжина маршруту (ребер)</span><span>{euler.path.length - 1}</span>
            </div>
            {renderEdgeRoute(euler.path)}
          </div>
        )}
      </section>

      <section className="py-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em]">Гамільтонові структури</h3>
          {hamilton?.path?.length > 0 && (
            <button 
              onClick={() => onHighlightPath(hamilton.path, hamilton.edge_ids, 'hamilton')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded text-[10px] font-black uppercase transition-all ${
                isHamiltonActive ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isHamiltonActive ? <><EyeOff size={12} /> Приховати</> : <><Eye size={12} /> Показати</>}
            </button>
          )}
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase italic mb-4">{hamilton?.message}</p>
        {hamilton?.path?.length > 0 && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center text-[11px] font-black uppercase text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
              <span>Довжина маршруту (ребер)</span><span>{hamilton.path.length-1}</span>
            </div>
            {renderVertexRoute(hamilton.path)}
          </div>
        )}
      </section>

      <section className="py-8 last:border-0 pb-24">
        <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em] mb-4">Числові інваріанти</h3>
        <div className="space-y-0">
          <StatRow 
            label="Хроматичне число χ(G)" 
            value={invariants?.chromatic_number} 
            color="text-fuchsia-600"
          >
            <button 
              onClick={onShowColoring}
              className={`flex items-center gap-2 text-[9px] font-black px-4 py-2 rounded-full border-2 transition-all uppercase tracking-widest ${
                isColoringActive 
                ? "bg-fuchsia-600 text-white border-fuchsia-600 shadow-md" 
                : "bg-white text-fuchsia-600 border-fuchsia-600 hover:bg-fuchsia-50"
              }`}
            >
              {isColoringActive ? <><EyeOff size={12} /> Приховати кольори</> : <><Eye size={12} /> Розфарбувати</>}
            </button>
          </StatRow>

          <StatRow label="Клікове число ω(G)" value={invariants?.clique_number} color="text-orange-600" />
          <StatRow label="Число незалежності α(G)" value={invariants?.independence_number} color="text-blue-600" />
        </div>
      </section>
    </div>
  );
};

export default GraphStats;