import networkx as nx

class GraphSolvers:
    def __init__(self, nodes, edges, is_directed=False):
        self.is_directed = is_directed
        self.G = nx.MultiDiGraph() if is_directed else nx.MultiGraph()
        self.labels = {}
        for node in nodes:
            n_id = str(node.get('id'))
            self.labels[n_id] = node.get('label', f"v{n_id}")
            self.G.add_node(n_id)
        for edge in edges:
            u, v = str(edge.get('from')), str(edge.get('to'))
            if u in self.G and v in self.G:
                self.G.add_edge(u, v, weight=float(edge.get('weight', 1)), id=edge.get('id'))

    def _get_path_edges(self, path_ids):
        edge_ids = []
        for i in range(len(path_ids) - 1):
            u, v = path_ids[i], path_ids[i+1]
            for key, data in self.G.get_edge_data(u, v).items():
                if data['id'] not in edge_ids:
                    edge_ids.append(data['id'])
                    break
        return edge_ids

    def get_eulerian_info(self):
        result = {"type": "none", "path": [], "edge_ids": [], "message": "Ейлерових структур не знайдено"}
        nodes_with_edges = [n for n, d in self.G.degree() if d > 0]
        if not nodes_with_edges: return result
        sub = self.G.subgraph(nodes_with_edges)
        try:
            if nx.is_eulerian(sub):
                circuit = list(nx.eulerian_circuit(sub, keys=True))
                path_ids = [u for u, v, k in circuit] + [circuit[0][0]]
                edge_ids = [sub[u][v][k]['id'] for u, v, k in circuit]
                return {
                    "type": "cycle",
                    "path": [self.labels[n] for n in path_ids],
                    "edge_ids": edge_ids,
                    "message": "Знайдено Ейлерів цикл"
                }
            if nx.has_eulerian_path(sub):
                path_edges = list(nx.eulerian_path(sub, keys=True))
                path_ids = [u for u, v, k in path_edges] + [path_edges[-1][1]]
                edge_ids = [sub[u][v][k]['id'] for u, v, k in path_edges]
                return {
                    "type": "path",
                    "path": [self.labels[n] for n in path_ids],
                    "edge_ids": edge_ids,
                    "message": "Знайдено Ейлерів шлях"
                }
        except Exception: pass
        return result

    def get_hamiltonian_info(self):
        nodes = list(self.G.nodes())
        n = len(nodes)
        if n == 0 or n > 20: return {"type": "none", "path": [], "edge_ids": [], "message": "Завеликий або порожній граф"}
        def find_ham(curr, path, looking_for_cycle):
            if len(path) == n:
                if not looking_for_cycle: return path
                if not self.is_directed and n < 3: return None
                if self.G.has_edge(path[-1], path[0]): return path + [path[0]]
                return None
            for neighbor in set(self.G.neighbors(curr)):
                if neighbor not in path:
                    res = find_ham(neighbor, path + [neighbor], looking_for_cycle)
                    if res: return res
            return None
        for start in nodes:
            res = find_ham(start, [start], True)
            if res:
                return {"type": "cycle", "path": [self.labels[n] for n in res], "edge_ids": self._get_path_edges(res), "message": "Знайдено Гамільтонів цикл"}
        for start in nodes:
            res = find_ham(start, [start], False)
            if res:
                return {"type": "path", "path": [self.labels[n] for n in res], "edge_ids": self._get_path_edges(res), "message": "Знайдено Гамільтонів шлях"}
        return {"type": "none", "path": [], "edge_ids": [], "message": "Гамільтонових структур не знайдено"}

    def get_graph_invariants(self):
        simple_G = nx.Graph(self.G.to_undirected())
        simple_G.remove_edges_from(nx.selfloop_edges(simple_G))
        coloring = nx.coloring.greedy_color(simple_G, strategy="largest_first")
        chromatic_number = max(coloring.values(), default=-1) + 1
        try:
            from networkx.algorithms import approximation
            clique_number = len(approximation.max_clique(simple_G))
            independence_set = approximation.maximum_independent_set(simple_G)
            independence_number = len(independence_set)
        except Exception:
            clique_number = 0
            independence_number = 0
        return {
            "chromatic_number": chromatic_number,
            "clique_number": clique_number,
            "independence_number": independence_number,
            "coloring": coloring
        }

    def get_all_solutions(self):
        return {
            "euler": self.get_eulerian_info(),
            "hamilton": self.get_hamiltonian_info(),
            "invariants": self.get_graph_invariants()
        }

def run_solve(nodes, edges, is_directed):
    solver = GraphSolvers(nodes, edges, is_directed)
    return solver.get_all_solutions()