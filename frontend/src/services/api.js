import axios from 'axios';

const API_URL = 'https://graphinfo.pythonanywhere.com/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const formatGraphData = (nodes, edges, isDirected) => {
  return {
    nodes: nodes.map(n => ({ id: n.id, label: n.label })),
    edges: edges.map(e => ({
      id: e.id,
      from: e.from,
      to: e.to,
      weight: e.weight
    })),
    is_directed: isDirected
  };
};

export const graphApi = {
  analyze: async (nodes, edges, isDirected) => {
    try {
      const response = await apiClient.post('/analyze/', formatGraphData(nodes, edges, isDirected));
      return response.data;
    } catch (error) {
      console.error("Помилка при аналізі графа:", error);
      throw error.response?.data || { error: "Сервер недоступний" };
    }
  },

  solve: async (nodes, edges, isDirected) => {
    try {
      const response = await apiClient.post('/solve/', formatGraphData(nodes, edges, isDirected));
      return response.data;
    } catch (error) {
      console.error("Помилка при розв'язанні задач графа:", error);
      throw error.response?.data || { error: "Помилка при пошуку циклів" };
    }
  },

runDijkstra: async (nodes, edges, isDirected, startNode, endNode) => {
    const response = await axios.post(`${API_URL}/dijkstra/`, {
      nodes: nodes.map(n => ({ id: n.id, label: n.label })),
      edges: edges.map(e => ({
        id: e.id,
        from: e.from,
        to: e.to,
        weight: e.weight,
        hasWeight: e.hasWeight
      })),
      is_directed: isDirected,
      start_node: startNode,
      end_node: endNode
    });
    return response.data;
  },
  runFloyd: async (nodes, edges, isDirected) => {
    try {
      const response = await apiClient.post('/floyd/', formatGraphData(nodes, edges, isDirected));
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Помилка в алгоритмі Флойда" };
    }
  },
  runDFS: async (nodes, edges, isDirected, startNode) => {
    try {
      const payload = {
        ...formatGraphData(nodes, edges, isDirected),
        start_node: startNode
      };
      const response = await apiClient.post('/traverse/dfs/', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Помилка в алгоритмі DFS" };
    }
  },
  runBFS: async (nodes, edges, isDirected, startNode) => {
    try {
      const payload = {
        ...formatGraphData(nodes, edges, isDirected),
        start_node: startNode
      };
      const response = await apiClient.post('/traverse/bfs/', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Помилка в алгоритмі BFS" };
    }
  }
};