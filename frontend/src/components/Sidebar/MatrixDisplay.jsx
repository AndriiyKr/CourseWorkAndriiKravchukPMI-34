import React from 'react';

const MatrixDisplay = ({ adjMatrix, incMatrix, nodes = [], edges = [], isDirected }) => {
  if (!adjMatrix || !nodes || nodes.length === 0) return null;

  const renderTable = (matrix, cols, rows, title) => (
    <section className="py-8 first:pt-0">
      <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em] mb-6 px-1">
        {title}
      </h3>
      
      <div className="overflow-x-auto border-2 border-slate-100 rounded-xl shadow-sm">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-100">
              <th className="p-4 border-r border-slate-100 bg-slate-100/30 text-[10px] font-black text-slate-400 italic min-w-[60px]">
                V \ {title.includes('інцидент') ? 'E' : 'V'}
              </th>
              {cols.map((c, i) => (
                <th 
                  key={i} 
                  className="p-4 border-r border-slate-100 last:border-0 font-black text-slate-900 text-[11px] uppercase min-w-[50px]"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matrix.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 bg-slate-50 border-r border-slate-100 font-black text-slate-900 text-xs">
                  {rows[i]}
                </td>
                {row.map((val, j) => (
                  <td 
                    key={j} 
                    className={`p-4 border-r border-slate-100 last:border-0 font-mono text-sm transition-all ${
                      val !== 0 
                        ? "text-indigo-700 font-black bg-indigo-50/30" 
                        : "text-slate-300"
                    }`}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const edgeLabels = (edges || []).map(e => {
    const uNode = nodes.find(n => n.id === e.from);
    const vNode = nodes.find(n => n.id === e.to);
    const u = uNode ? uNode.label : '?';
    const v = vNode ? vNode.label : '?';
    return isDirected ? `(${u},${v})` : `{${u},${v}}`;
  });

  const nodeLabels = nodes.map(n => n.label);

  return (
    <div className="divide-y divide-slate-200 font-sans">
      {renderTable(
        adjMatrix, 
        nodeLabels, 
        nodeLabels, 
        "Матриця суміжності"
      )}
      
      {incMatrix && incMatrix.length > 0 && edgeLabels.length > 0 && 
        renderTable(
          incMatrix, 
          edgeLabels, 
          nodeLabels, 
          "Матриця інцидентності"
        )
      }
    </div>
  );
};

export default MatrixDisplay;