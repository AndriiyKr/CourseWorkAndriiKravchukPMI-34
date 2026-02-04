import React, { useState } from 'react';
import GraphCanvas from './components/Canvas/GraphCanvas';
import Sidebar from './components/Sidebar/Sidebar';
import Toolbar from './components/Canvas/Toolbar';
import WeightModal from './components/Modals/WeightModal';
import { graphApi } from './services/api';
import RenameModal from './components/Modals/RenameModal';
import ConfirmModal from './components/Modals/ConfirmModal';
import './index.css';

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isDirected, setIsDirected] = useState(false);
  const [activeTool, setActiveTool] = useState('vertex');
  const [weightModal, setWeightModal] = useState({ show: false, edgeId: null, initialValue: '' });
  const [renameModal, setRenameModal] = useState({ show: false, nodeId: null, initialValue: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false });
  const [analysis, setAnalysis] = useState(null);
  const [solutions, setSolutions] = useState(null);
  const [floydResult, setFloydResult] = useState(null);
  const [isColoringActive, setIsColoringActive] = useState(false);
  const [dijkstraResult, setDijkstraResult] = useState(null);
  const [dfsResult, setDfsResult] = useState(null);
  const [bfsResult, setBfsResult] = useState(null);
  const [activePathType, setActivePathType] = useState('none');
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [highlightedEdges, setHighlightedEdges] = useState([]);
  const colorPalette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
  
  const handleToggleColoring = () => {
    setIsColoringActive(!isColoringActive);
  };

  const displayNodes = nodes.map(node => {
    if (isColoringActive && solutions?.invariants?.coloring) {
      const colorIdx = solutions.invariants.coloring[String(node.id)];
      if (colorIdx !== undefined) {
        return { 
          ...node, 
          color: colorPalette[colorIdx % colorPalette.length] 
        };
      }
    }
    return node;
  });

  const generateUniqueLabel = () => {
    let i = 0;
    while (nodes.some(n => n.label === `v${i}`)) {
      i++;
    }
    return `v${i}`;
  };

  const handleAddNode = (coords) => {
    const newLabel = generateUniqueLabel();
    setNodes(prev => [...prev, { id: Date.now(), x: coords.x, y: coords.y, label: newLabel }]);
  };

  const handleOpenWeightModal = (edgeId, weight) => {
    setWeightModal({ show: true, edgeId, initialValue: weight });
  };

  const handleSaveWeight = (newWeight) => {
    setEdges(prev => prev.map(e => 
      e.id === weightModal.edgeId ? { ...e, weight: newWeight, hasWeight: true } : e
    ));
    setWeightModal({ show: false, edgeId: null, initialValue: '' });
  };

  const handleOpenRenameModal = (nodeId, label) => {
    setRenameModal({ show: true, nodeId, initialValue: label });
  };

  const handleSaveRename = (newLabel) => {
    const isDuplicate = nodes.some(n => n.label === newLabel && n.id !== renameModal.nodeId);
    if (isDuplicate) {
      alert(`Назва "${newLabel}" вже використовується іншою вершиною!`);
      return;
    }
    setNodes(prev => prev.map(n => n.id === renameModal.nodeId ? { ...n, label: newLabel } : n));
    setRenameModal({ show: false, nodeId: null, initialValue: '' });
  };

  const handleClearCanvas = () => {
    setConfirmModal({ show: true });
  };

  const confirmClear = () => {
    setNodes([]);
    setEdges([]);
    setAnalysis(null);
    setSolutions(null);
    setDijkstraResult(null);
    setDfsResult(null);
    setBfsResult(null);
    setFloydResult(null);
    setHighlightedNodes([]);
    setHighlightedEdges([]);
    setIsColoringActive(false);
    setConfirmModal({ show: false });
  };

  const handleAnalyze = async () => {
    if (nodes.length === 0) return;
    try {
      const analysisData = await graphApi.analyze(nodes, edges, isDirected);
      setAnalysis({
        ...analysisData,
        nodesSnapshot: [...nodes],
        edgesSnapshot: [...edges]
      });
      const solutionsData = await graphApi.solve(nodes, edges, isDirected);
      setSolutions(solutionsData);
    } catch (err) {
      console.error(err);
      alert("Помилка зв'язку з сервером");
    }
  };

  const handleHighlightPath = (pathLabels, edgeIds = [], type = 'none') => {
    if (activePathType === type && type !== 'none') {
      setHighlightedNodes([]);
      setHighlightedEdges([]);
      setActivePathType('none');
      return;
    }
    const nodeIds = pathLabels.map(label => {
      const node = nodes.find(n => n.label === label);
      return node ? node.id : null;
    }).filter(id => id !== null);
    setHighlightedNodes(nodeIds);
    setHighlightedEdges(edgeIds || []);
    setActivePathType(type);
  };

  const handleRunAlgorithm = async (type, params) => {
    setHighlightedNodes([]);
    setHighlightedEdges([]);
    try {
      if (type === 'floyd') {
        const result = await graphApi.runFloyd(nodes, edges, isDirected);
        setFloydResult(result);
      }
      else if (type === 'dijkstra') {
        const result = await graphApi.runDijkstra(nodes, edges, isDirected, params.start_node, params.end_node);
        if (result.success) {
          setHighlightedNodes(result.path_nodes_ids);
          setHighlightedEdges(result.path_edges.map(e => e.id));
        }
        setDijkstraResult(result);
      } else if (type === 'dfs') {
        const result = await graphApi.runDFS(nodes, edges, isDirected, params.start_node);
        if (result.tree_edges) setHighlightedEdges(result.tree_edges.map(e => e.id));
        setDfsResult(result);
      } else if (type === 'bfs') {
        const result = await graphApi.runBFS(nodes, edges, isDirected, params.start_node);
        if (result.tree_edges) setHighlightedEdges(result.tree_edges.map(e => e.id));
        setBfsResult(result);
      }
    } catch (err) {
      const errorObj = { error: "Помилка при виконанні алгоритму" };
      if (type === 'dijkstra') setDijkstraResult(errorObj);
      else if (type === 'floyd') setFloydResult(errorObj);
      else if (type === 'dfs') setDfsResult(errorObj);
      else if (type === 'bfs') setBfsResult(errorObj);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      <main className="relative flex-1 h-full p-4 flex flex-col min-w-0">
        <div className="flex-1 relative">
          <Toolbar 
            activeTool={activeTool} 
            setActiveTool={setActiveTool} 
            isDirected={isDirected} 
            setIsDirected={setIsDirected}
            hasEdges={edges.length > 0}
            onClear={handleClearCanvas}
          />
          <GraphCanvas 
            nodes={displayNodes}
            setNodes={setNodes}
            edges={edges} 
            setEdges={setEdges}
            activeTool={activeTool}
            isDirected={isDirected}
            highlightedNodes={highlightedNodes}
            highlightedEdges={highlightedEdges}
            onOpenWeightModal={handleOpenWeightModal}
            onOpenRenameModal={handleOpenRenameModal}
            onAddNode={handleAddNode}
          />
        </div>
      </main>

      <aside className="w-[37.5%] h-full bg-white border-l border-slate-200 shadow-2xl z-20 overflow-y-auto">
        <Sidebar 
          nodes={nodes} 
          edges={edges} 
          isDirected={isDirected}
          analysis={analysis} 
          solutions={solutions}
          isColoringActive={isColoringActive}
          onShowColoring={handleToggleColoring}
          onHighlightPath={handleHighlightPath}
          highlightedEdges={highlightedEdges}
          activePathType={activePathType}
          dijkstraResult={dijkstraResult}
          floydResult={floydResult}
          dfsResult={dfsResult}
          bfsResult={bfsResult}
          onRunAlgo={handleRunAlgorithm}
          onClearDijkstra={() => { setDijkstraResult(null); setHighlightedNodes([]); setHighlightedEdges([]); }}
          onClearDFS={() => { setDfsResult(null); setHighlightedEdges([]); }}
          onClearBFS={() => { setBfsResult(null); setHighlightedEdges([]); }}
          onAnalyze={handleAnalyze} 
        />
      </aside>

      {weightModal.show && (
        <WeightModal 
          initialValue={weightModal.initialValue}
          onSave={handleSaveWeight}
          onClose={() => setWeightModal({ show: false, edgeId: null, initialValue: '' })}
        />
      )}
      {renameModal.show && (
        <RenameModal 
          initialValue={renameModal.initialValue} 
          existingLabels={nodes.map(n => n.label)}
          onSave={handleSaveRename} 
          onClose={() => setRenameModal({ show: false, nodeId: null, initialValue: '' })} 
        />
      )}
      {confirmModal.show && (
        <ConfirmModal 
          message="Ви впевнені, що хочете повністю видалити граф? Цю дію неможливо буде скасувати."
          onConfirm={confirmClear}
          onClose={() => setConfirmModal({ show: false })}
        />
      )}
    </div>
  );
}
export default App;