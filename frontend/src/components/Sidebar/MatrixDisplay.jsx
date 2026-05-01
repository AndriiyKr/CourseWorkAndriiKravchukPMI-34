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

  const nodeLabels = nodes.map(n => n.label);

  // ДИНАМІЧНЕ ФОРМУВАННЯ ПІДПИСІВ РЕБЕР НА ОСНОВІ ДАНИХ МАТРИЦІ
  const edgeLabels = [];
  if (incMatrix && incMatrix.length > 0) {
    const numCols = incMatrix[0].length;
    const numRows = incMatrix.length;

    for (let j = 0; j < numCols; j++) {
      const connected = [];
      for (let i = 0; i < numRows; i++) {
        const val = Number(incMatrix[i][j]);
        if (val !== 0) {
          connected.push({ rowIdx: i, val: val });
        }
      }

      if (connected.length === 2) {
        let uIdx = connected[0].rowIdx;
        let vIdx = connected[1].rowIdx;

        // Врахування напрямку для орієнтованого графа (-1 -> 1)
        if (isDirected) {
          const tail = connected.find(c => c.val === -1);
          const head = connected.find(c => c.val === 1);
          if (tail && head) {
            uIdx = tail.rowIdx;
            vIdx = head.rowIdx;
          }
        }

        const uLabel = nodeLabels[uIdx] || `v${uIdx}`;
        const vLabel = nodeLabels[vIdx] || `v${vIdx}`;
        edgeLabels.push(isDirected ? `(${uLabel},${vLabel})` : `{${uLabel},${vLabel}}`);
      } else if (connected.length === 1) {
        // Петля
        const uLabel = nodeLabels[connected[0].rowIdx] || `v${connected[0].rowIdx}`;
        edgeLabels.push(`{${uLabel},${uLabel}}`);
      } else {
        edgeLabels.push(`e${j + 1}`); // Запасний варіант
      }
    }
  }

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
