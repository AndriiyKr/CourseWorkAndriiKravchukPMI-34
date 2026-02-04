import React from 'react';

const AdjacencyListDisplay = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <section className="py-8">
      <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em] mb-6 px-1">
        Списки суміжності
      </h3>
      
      <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-r border-slate-200 w-1/3">
                Вершина
              </th>
              <th className="p-4 text-[10px] font-black text-slate-900 uppercase tracking-wider">
                Суміжні вершини
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-black text-slate-900 text-sm border-r border-slate-200 bg-slate-50/30">
                  {row.vertex}
                </td>
                <td className="p-4 text-slate-800 text-sm font-medium leading-relaxed">
                  {row.neighbors}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdjacencyListDisplay;