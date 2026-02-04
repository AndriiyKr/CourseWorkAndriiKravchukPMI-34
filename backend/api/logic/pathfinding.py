import networkx as nx

class PathFinder:
    def __init__(self, nodes, edges, is_directed=False):
        self.is_directed = is_directed
        self.raw_edges = edges
        self.G = nx.MultiDiGraph() if is_directed else nx.MultiGraph()
        if not nodes:
            self.node_ids = []
            return
        sorted_nodes = sorted(nodes, key=lambda x: x.get('id'))
        self.node_ids = [str(n['id']) for n in sorted_nodes]
        self.node_to_idx = {n_id: i for i, n_id in enumerate(self.node_ids)}
        self.idx_to_label = {i: n.get('label', f"v{i+1}") for i, n in enumerate(sorted_nodes)}
        for node in sorted_nodes:
            self.G.add_node(str(node['id']), label=node.get('label', f"v{node.get('id')}"))
        for edge in edges:
            u, v = str(edge['from']), str(edge['to'])
            if u in self.node_ids and v in self.node_ids:
                raw_weight = edge.get('weight')
                raw_has_weight = edge.get('hasWeight')
                try:
                    w = float(raw_weight) if raw_weight is not None else 1.0
                except (ValueError, TypeError):
                    w = 1.0
                has_weight_bool = bool(raw_has_weight) or (raw_weight is not None)
                self.G.add_edge(
                    u, v, 
                    weight=w, 
                    edge_id=edge.get('id'),
                    has_weight=has_weight_bool 
                )

    def _validate_weights(self):
        unweighted_count = 0
        for u, v, key, data in self.G.edges(data=True, keys=True):
            if not data.get('has_weight', False):
                unweighted_count += 1
        if unweighted_count > 0:
            return {
                "success": False, 
                "error": f"Алгоритм неможливий: {unweighted_count} ребер не мають ваги. Встановіть вагу для кожного ребра."
            }
        return None

    def run_dijkstra(self, start_node, end_node):
        val_error = self._validate_weights()
        if val_error: return val_error
        for u, v, data in self.G.edges(data=True):
            if data.get('weight', 0) < 0:
                return {"success": False, "error": "Алгоритм Дейкстри не працює з від'ємними вагами."}
        try:
            start_node, end_node = str(start_node), str(end_node)
            if start_node not in self.G or end_node not in self.G:
                return {"success": False, "error": "Обрану вершину не знайдено (можливо, її було видалено)."}
            if start_node == end_node:
                return {"success": True, "path_nodes_ids": [start_node], "path_edges": [], "total_weight": 0}
            path_nodes = nx.dijkstra_path(self.G, source=start_node, target=end_node, weight='weight')
            path_weight = nx.dijkstra_path_length(self.G, source=start_node, target=end_node, weight='weight')
            path_edges = []
            for i in range(len(path_nodes) - 1):
                u, v = path_nodes[i], path_nodes[i+1]
                edge_data = self.G.get_edge_data(u, v)
                best_key = min(edge_data, key=lambda k: edge_data[k]['weight'])
                path_edges.append({
                    "from": u, "to": v, 
                    "id": edge_data[best_key].get('edge_id')
                })
            return {
                "success": True,
                "path_nodes_ids": path_nodes,
                "path_edges": path_edges,
                "total_weight": path_weight
            }
        except nx.NetworkXNoPath:
            return {"success": False, "error": "Шлях між обраними вершинами не існує."}
        except Exception as e:
            return {"success": False, "error": str(e)}
        
    def run_floyd_warshall(self):
        val_error = self._validate_weights()
        if val_error: return val_error
        n = len(self.node_ids)
        dist = [[float('inf')] * n for _ in range(n)]
        pred = [[(i + 1) if i != j else 0 for j in range(n)] for i in range(n)]
        for i in range(n):
            dist[i][i] = 0
        for u_id, v_id, data in self.G.edges(data=True):
            if u_id not in self.node_to_idx or v_id not in self.node_to_idx:
                continue
            u = self.node_to_idx[u_id]
            v = self.node_to_idx[v_id]
            w = data['weight']
            if w < dist[u][v]:
                dist[u][v] = w
                pred[u][v] = u + 1
            if not self.is_directed:
                if w < dist[v][u]:
                    dist[v][u] = w
                    pred[v][u] = v + 1

        def get_snapshot(d_mat, p_mat):
            return {
                "M": [["∞" if x == float('inf') else (int(x) if x == int(x) else x) for x in row] for row in d_mat],
                "T": [[x for x in row] for row in p_mat]
            }

        steps = [get_snapshot(dist, pred)]
        for k in range(n):
            for i in range(n):
                for j in range(n):
                    if dist[i][k] != float('inf') and dist[k][j] != float('inf'):
                        if dist[i][k] + dist[k][j] < dist[i][j]:
                            dist[i][j] = dist[i][k] + dist[k][j]
                            pred[i][j] = pred[k][j]
            steps.append(get_snapshot(dist, pred))
        return {
            "success": True,
            "steps": steps,
            "labels": [self.idx_to_label[i] for i in range(n)],
            "node_ids": self.node_ids
        }

def run_floyd(nodes, edges, is_directed):
    finder = PathFinder(nodes, edges, is_directed)
    return finder.run_floyd_warshall()

def run_dijkstra(nodes, edges, is_directed, start_node, end_node):
    finder = PathFinder(nodes, edges, is_directed)
    return finder.run_dijkstra(start_node, end_node)