import React, { forwardRef } from 'react';

// Універсальний пошук змінних
const deepFind = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of keys) {
    if (key in obj && obj[key] !== null && obj[key] !== undefined && obj[key] !== "" && obj[key] !== "Не знайдено") {
      return obj[key];
    }
  }
  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object') {
      const found = deepFind(val, keys);
      if (found !== null) return found;
    }
  }
  return null;
};

const PDFReport = forwardRef(({ nodes = [], edges = [], graphStats, solutions, eulerianData, hamiltonianData }, ref) => {
  
  const safeStats = graphStats || {};
  const safeSolutions = solutions || {};

  const search = (keys) => deepFind(safeStats, keys) ?? deepFind(safeSolutions, keys);

  // 1. БАЗОВІ ХАРАКТЕРИСТИКИ
  const isDirectedGraph = edges.some(e => e.isDirected);
  const vertexConn = search(['vertex_connectivity', 'node_connectivity']) ?? 0;
  const edgeConn = search(['edge_connectivity']) ?? 0;
  const componentsCount = search(['components_count', 'connected_components_count']) ?? (safeStats.is_connected ? 1 : "Більше 1");
  
  const rawCycle = search(['has_cycle', 'hasCycle']);
  const hasCycle = (rawCycle === true || String(rawCycle).toLowerCase() === 'true' || rawCycle === 'Так') ? "Так" : "Ні";
  
  const rawRegular = search(['is_regular', 'isRegular']);
  const isRegular = (rawRegular === true || String(rawRegular).toLowerCase() === 'true' || rawRegular === 'Так') ? "Так" : "Ні";
  
  const girth = search(['girth']) ?? "н/д";
  const chromatic = search(['chromatic_number', 'chromaticNumber']) ?? "н/д";
  
  let clique = search(['clique_number', 'cliqueNumber']);
  if (clique === null) {
    const clqArr = search(['max_clique', 'maxClique']);
    clique = Array.isArray(clqArr) ? clqArr.length : "н/д";
  }

  let independence = search(['independence_number', 'independenceNumber']);
  if (independence === null) {
    const indArr = search(['max_independent_set', 'maxIndependentSet']);
    independence = Array.isArray(indArr) ? indArr.length : "н/д";
  }

  // 2. ОБРОБКА ШЛЯХІВ ЗГІДНО З САЙДБАРОМ
  let eulerObj = eulerianData || safeSolutions?.euler || safeStats?.euler;
  let hamilObj = hamiltonianData || safeSolutions?.hamilton || safeStats?.hamilton;

  const formatEulerPath = (arr) => {
    let pathArray = [];
    if (typeof arr[0] === 'number' || (typeof arr[0] === 'string' && !arr[0].includes('{'))) {
      for(let i = 0; i < arr.length - 1; i++) {
        const v1 = String(arr[i]).replace('v', '');
        const v2 = String(arr[i+1]).replace('v', '');
        pathArray.push(`{v${v1}, v${v2}}`);
      }
    } else {
      pathArray = arr.map(e => String(e));
    }
    return { length: pathArray.length, pathArray };
  };

  const formatHamilPath = (arr) => {
    return {
      length: arr.length > 0 ? arr.length - 1 : 0,
      pathArray: arr.map(n => `v${String(n).replace('v', '')}`)
    };
  };

  const renderPathBlock = (title, obj, pathFormatter, themeColor) => {
    if (!obj || !obj.message) {
      return (
        <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid #94a3b8`, pageBreakInside: 'avoid' }}>
          <p style={{ margin: '0', fontSize: '13pt', color: '#475569' }}><b>{title}:</b> Не знайдено</p>
        </div>
      );
    }

    const hasPath = Array.isArray(obj.path) && obj.path.length > 0 && String(obj.path[0]).toLowerCase() !== 'false';

    if (!hasPath) {
      return (
        <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid #94a3b8`, pageBreakInside: 'avoid' }}>
          <p style={{ margin: '0', fontSize: '13pt', color: '#475569' }}><b>{title}:</b> {obj.message}</p>
        </div>
      );
    }

    const formatted = pathFormatter(obj.path);
    const bgColor = themeColor === '#3b82f6' ? '#eff6ff' : '#fffbeb';

    return (
      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: bgColor, borderRadius: '8px', borderLeft: `4px solid ${themeColor}`, pageBreakInside: 'avoid', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '13pt', color: '#1e293b' }}><b>{title}:</b> <i>{obj.message}</i></p>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '11pt', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginRight: '10px' }}>Довжина маршруту (ребер):</span>
          <span style={{ fontSize: '13pt', fontWeight: 'bold', color: themeColor }}>{formatted.length}</span>
        </div>
        <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#0f172a', lineHeight: '1.6' }}>
          {formatted.pathArray.join(' → ')}
        </div>
      </div>
    );
  };

  // 3. ВІДМАЛЬОВКА ГРАФА
  const renderGraphSVG = () => {
    if (!nodes || nodes.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      if (node.x < minX) minX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.x > maxX) maxX = node.x;
      if (node.y > maxY) maxY = node.y;
    });

    const padding = 40; 
    const width = Math.max(1, maxX - minX + padding * 2);
    const height = Math.max(1, maxY - minY + padding * 2);
    const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;

    const getEffectiveCurvature = (edge) => {
      if (edge.curvature !== 0) return edge.curvature;
      const samePair = edges.filter(e => (e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from));
      if (samePair.length <= 1) return 0;
      const idx = samePair.findIndex(e => e.id === edge.id);
      return (idx - (samePair.length - 1) / 2) * 50;
    };

    return (
      <svg viewBox={viewBox} style={{ width: '100%', maxHeight: '400px', backgroundColor: 'transparent' }}>
        <defs>
          <marker id="pdf-arrow" markerWidth="10" markerHeight="10" refX="29" refY="5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L10,5 L0,10 Z" fill="#334155"/>
          </marker>
        </defs>
        {edges.map(edge => {
          const from = nodes.find(n => n.id === edge.from);
          const to = nodes.find(n => n.id === edge.to);
          if (!from || !to) return null;

          const isLoop = edge.from === edge.to;
          let path, labelX, labelY;

          if (isLoop) {
            const idx = edges.filter(e => e.from === edge.from && e.to === edge.to).findIndex(e => e.id === edge.id);
            const h = 85 + (edge.curvature || 0) + idx * 30; 
            const w = 35 + idx * 20; 
            path = `M ${from.x},${from.y} C ${from.x - w},${from.y - h} ${from.x + w},${from.y - h} ${from.x},${from.y}`;
            labelX = from.x; labelY = from.y - h + 15;
          } else {
            const curv = getEffectiveCurvature(edge);
            const dx = to.x - from.x, dy = to.y - from.y, dist = Math.hypot(dx, dy);
            const ctrlX = (from.x + to.x) / 2 + (curv * dy) / (dist || 1);
            const ctrlY = (from.y + to.y) / 2 - (curv * dx) / (dist || 1);
            path = `M${from.x},${from.y} Q${ctrlX},${ctrlY} ${to.x},${to.y}`;
            labelX = (from.x + 2 * ctrlX + to.x) / 4;
            labelY = (from.y + 2 * ctrlY + to.y) / 4;
          }

          return (
            <g key={edge.id}>
              {/* Темніші ребра (#334155) */}
              <path d={path} stroke="#334155" strokeWidth="2.5" fill="none" markerEnd={edge.isDirected ? "url(#pdf-arrow)" : ""} />
              {edge.hasWeight && (
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <rect x="-14" y="-12" width="28" height="24" rx="4" fill="#ffffff00" fillOpacity="0.9" stroke="#ffffff00" />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#ffffff00" fontWeight="bold">
                    {edge.weight}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {nodes.map(node => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <circle r="20" fill={node.color || "#f8fafc"} stroke="#111f35" strokeWidth="3" />
            <text textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="bold" fill="#1e293b" fontFamily='"Segoe UI", Arial, sans-serif'>
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  // 4. УНІВЕРСАЛЬНИЙ РЕНДЕР ТАБЛИЦЬ (ІЗ ПЕРЕНОСОМ НА НОВИЙ РЯДОК ТА ДИНАМІЧНИМИ ПІДПИСАМИ)
  const renderTable = (matrix, title, type = 'adjacency') => {
    if (!matrix || !Array.isArray(matrix) || matrix.length === 0) return null;
    
    // Список суміжності обробляємо окремо
    if (type === 'list') {
      return (
        <div style={{ marginBottom: '35px', pageBreakInside: 'avoid', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15pt', fontWeight: 'bold', color: '#1e40af', marginBottom: '15px', borderBottom: '2px solid #bfdbfe', paddingBottom: '5px' }}>{title}</h3>
          <table style={{ borderCollapse: 'collapse', width: '80%', margin: '0 auto', fontSize: '11pt', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                <th style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #3b82f6', width: '30%' }}>Вершина</th>
                <th style={{ padding: '12px 15px', textAlign: 'center', verticalAlign: 'middle' }}>Суміжні вершини</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#1e3a8a', borderRight: '1px solid #e2e8f0' }}>
                    {row.vertex || `v${i}`}
                  </td>
                  <td style={{ padding: '10px 15px', textAlign: 'left', verticalAlign: 'middle', color: '#334155' }}>
                    {row.neighbors || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // ЛОГІКА РОЗБИТТЯ (CHUNKING) ДЛЯ ШИРОКИХ МАТРИЦЬ
    const totalCols = matrix[0].length;
    const maxCols = type === 'incidence' ? 6 : 12; 
    const chunks = [];

    for (let i = 0; i < totalCols; i += maxCols) {
      chunks.push({ start: i, end: Math.min(i + maxCols, totalCols) });
    }

    return (
      <div style={{ marginBottom: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {chunks.map((chunk, chunkIdx) => {
          
          // ФОРМУЄМО ДИНАМІЧНІ ЗАГОЛОВКИ СТОВПЦІВ ДЛЯ ШМАТКА
          const headerCells = [];
          for (let j = chunk.start; j < chunk.end; j++) {
            if (type === 'incidence') {
              const connected = [];
              for (let r = 0; r < matrix.length; r++) {
                const val = Number(matrix[r][j]);
                if (val !== 0) connected.push({ rowIdx: r, val: val });
              }

              let colLabel = `e${j + 1}`;
              if (connected.length === 2) {
                let uIdx = connected[0].rowIdx;
                let vIdx = connected[1].rowIdx;
                
                if (isDirectedGraph) {
                  const tail = connected.find(c => c.val === -1);
                  const head = connected.find(c => c.val === 1);
                  if (tail && head) {
                    uIdx = tail.rowIdx;
                    vIdx = head.rowIdx;
                  }
                }
                
                const uLbl = nodes[uIdx]?.label || `v${uIdx}`;
                const vLbl = nodes[vIdx]?.label || `v${vIdx}`;
                colLabel = isDirectedGraph ? `(${uLbl}; ${vLbl})` : `{${uLbl}; ${vLbl}}`;
              } else if (connected.length === 1) {
                const uLbl = nodes[connected[0].rowIdx]?.label || `v${connected[0].rowIdx}`;
                colLabel = `{${uLbl}; ${uLbl}}`;
              }
              headerCells.push(colLabel);
            } else {
              headerCells.push(`v${j}`);
            }
          }

          return (
            <div key={chunkIdx} style={{ width: '90%', marginBottom: chunkIdx < chunks.length - 1 ? '25px' : '0', pageBreakInside: 'avoid' }}>
              <div style={{ position: 'relative', width: '100%', marginBottom: '10px' }}>
                {chunkIdx === 0 && (
                  <h3 style={{ fontSize: '15pt', fontWeight: 'bold', color: '#1e40af', margin: '0', borderBottom: '2px solid #bfdbfe', paddingBottom: '5px', textAlign: 'center' }}>
                    {title}
                  </h3>
                )}
                {chunkIdx > 0 && (
                  <div style={{ textAlign: 'right', fontSize: '10pt', fontStyle: 'italic', color: '#64748b', marginTop: '5px' }}>
                    Продовження матриці {type === 'incidence' ? 'інцидентності' : 'суміжності'}...
                  </div>
                )}
              </div>
              
              <table style={{ borderCollapse: 'collapse', width: '100%', margin: '0 auto', fontSize: '11pt', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                    <th style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #3b82f6' }}>#</th>
                    {headerCells.map((lbl, idx) => (
                      <th key={idx} style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle', borderRight: idx < headerCells.length - 1 ? '1px solid #3b82f6' : 'none' }}>
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, i) => {
                    const rowSlice = row.slice(chunk.start, chunk.end);
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#1e3a8a', borderRight: '1px solid #e2e8f0' }}>
                          v{i}
                        </td>
                        {rowSlice.map((cell, j) => (
                          <td key={j} style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle', color: '#475569', borderRight: j < rowSlice.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                            {cell === Infinity || cell === "inf" ? "∞" : cell}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDegreesTable = (degrees) => {
    if (!degrees || degrees.length === 0) return null;
    return (
      <div style={{ margin: '15px 0 30px 0', pageBreakInside: 'avoid', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <table style={{ borderCollapse: 'collapse', width: '60%', margin: '0 auto', fontSize: '11pt', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #3b82f6' }}>Вершина</th>
              <th style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle' }}>Степінь</th>
            </tr>
          </thead>
          <tbody>
            {degrees.map((item, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#1e3a8a', borderRight: '1px solid #e2e8f0' }}>
                  {item.label}
                </td>
                <td style={{ padding: '8px', textAlign: 'center', verticalAlign: 'middle', color: '#334155' }}>
                  {item.degree}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const MathSym = ({ children }) => <i style={{ fontFamily: '"Georgia", serif', color: '#2563eb' }}>{children}</i>;

  return (
    <div ref={ref} style={{ fontFamily: '"Times New Roman", Times, serif', color: '#1e293b', fontSize: '12pt', lineHeight: '1.6', backgroundColor: '#fff', padding: '0 15px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '3px solid #1e40af' }}>
        <h1 style={{ fontSize: '24pt', margin: '0', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '1px' }}>Аналіз графа</h1>
        <p style={{ fontSize: '11pt', marginTop: '10px', color: '#64748b', fontStyle: 'italic' }}>Технічний звіт згенеровано: {new Date().toLocaleString("uk-UA")}</p>
      </div>

      <section style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
        <h2 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1e40af', marginBottom: '20px', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>
          1. Візуальна топологія
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px', backgroundColor: 'transparent' }}> 
          {renderGraphSVG()}
        </div>
      </section>

      {(Object.keys(safeStats).length > 0 || Object.keys(safeSolutions).length > 0) && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1e40af', marginBottom: '25px', borderLeft: '4px solid #3b82f6', paddingLeft: '10px', pageBreakInside: 'avoid' }}>
            2. Характеристики графа
          </h2>
          
          <div style={{ marginBottom: '35px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '30px', pageBreakInside: 'avoid' }}>
              <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #64748b' }}>
                <p style={{ margin: '0', fontSize: '10pt', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Тип графа</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '14pt', fontWeight: 'bold', color: '#0f172a' }}>{isDirectedGraph ? "Орієнтований" : "Неорієнтований"}</p>
              </div>
              <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #64748b' }}>
                <p style={{ margin: '0', fontSize: '10pt', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Кількість вершин</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '14pt', fontWeight: 'bold', color: '#0f172a' }}>{nodes.length}</p>
              </div>
              <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #64748b' }}>
                <p style={{ margin: '0', fontSize: '10pt', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Наявність циклів</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '14pt', fontWeight: 'bold', color: '#0f172a' }}>
                  {hasCycle} {hasCycle === "Так" && <span style={{ fontSize: '11pt', color: '#475569', fontWeight: 'normal' }}>(Найкоротший: {girth})</span>}
                </p>
              </div>
              <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #64748b' }}>
                <p style={{ margin: '0', fontSize: '10pt', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Регулярність</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '14pt', fontWeight: 'bold', color: '#0f172a' }}>{isRegular}</p>
              </div>
            </div>

            <div style={{ pageBreakInside: 'avoid', textAlign: 'center' }}>
               <h3 style={{ fontSize: '13pt', color: '#1e40af', marginBottom: '10px' }}>Степені вершин</h3>
              {renderDegreesTable(search(['degrees', 'Degrees']))}
            </div>

            <h3 style={{ fontSize: '14pt', color: '#1e40af', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '15px', pageBreakInside: 'avoid' }}>Аналітичні показники</h3>
            <ul style={{ listStyleType: 'none', padding: '0', margin: '0 0 30px 0', pageBreakInside: 'avoid' }}>
              <li style={{ padding: '10px 0', borderBottom: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Кількість компонент зв’язності:</span> <strong style={{ color: '#0f172a' }}>{componentsCount}</strong>
              </li>
              <li style={{ padding: '10px 0', borderBottom: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Число вершинної зв’язності <MathSym>κ(G)</MathSym>:</span> <strong style={{ color: '#0f172a' }}>{vertexConn}</strong>
              </li>
              <li style={{ padding: '10px 0', borderBottom: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Число реберної зв’язності <MathSym>λ(G)</MathSym>:</span> <strong style={{ color: '#0f172a' }}>{edgeConn}</strong>
              </li>
              <li style={{ padding: '10px 0', borderBottom: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Хроматичне число <MathSym>χ(G)</MathSym>:</span> <strong style={{ color: '#0f172a' }}>{chromatic}</strong>
              </li>
              <li style={{ padding: '10px 0', borderBottom: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Клікове число <MathSym>ω(G)</MathSym>:</span> <strong style={{ color: '#0f172a' }}>{clique}</strong>
              </li>
              <li style={{ padding: '10px 0', borderBottom: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Число незалежності <MathSym>α(G)</MathSym>:</span> <strong style={{ color: '#0f172a' }}>{independence}</strong>
              </li>
            </ul>

            <h3 style={{ fontSize: '14pt', color: '#1e40af', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '20px', pageBreakInside: 'avoid' }}>Структурні маршрути</h3>
            {renderPathBlock('Ейлерові структури', eulerObj, formatEulerPath, '#3b82f6')}
            {renderPathBlock('Гамільтонові структури', hamilObj, formatHamilPath, '#d97706')}
          </div>

          <div style={{ pageBreakBefore: 'always' }}>
            <h2 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1e40af', marginBottom: '25px', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>
              3. Матричні представлення
            </h2>
            {renderTable(search(['adjacency_matrix']), "Матриця суміжності", "adjacency")}
            <div style={{ margin: '40px 0' }}></div>
            {renderTable(search(['incidence_matrix']), "Матриця інцидентності", "incidence")}
            <div style={{ margin: '40px 0' }}></div>
            {renderTable(search(['adjacency_list']), "Списки суміжності", "list")}
          </div>
        </section>
      )}
    </div>
  );
});

export default PDFReport;
