import networkx as nx
import numpy as np

class GraphAnalyzer:
    def __init__(self, nodes, edges, is_directed=False):
        self.is_directed = is_directed
        self.G = nx.MultiDiGraph() if is_directed else nx.MultiGraph()
        for node in nodes:
            self.G.add_node(str(node['id']), label=node.get('label', f"v{node['id']}"))
        for edge in edges:
            self.G.add_edge(str(edge['from']), str(edge['to']), weight=float(edge.get('weight', 1)))

    def get_adjacency_matrix(self):
        if not self.G.nodes: return []
        matrix = nx.adjacency_matrix(self.G, weight=None).todense()
        return matrix.tolist()

    def get_incidence_matrix(self):
        nodes = list(self.G.nodes())
        edges = list(self.G.edges(keys=True))
        if not nodes or not edges: 
            return []
        num_nodes = len(nodes)
        num_edges = len(edges)
        matrix = np.zeros((num_nodes, num_edges), dtype=int)
        node_to_idx = {node_id: i for i, node_id in enumerate(nodes)}
        for j, (u, v, key) in enumerate(edges):
            u_idx = node_to_idx[u]
            v_idx = node_to_idx[v]
            if u == v:
                matrix[u_idx, j] = 2
            else:
                if self.is_directed:
                    matrix[u_idx, j] = -1
                    matrix[v_idx, j] = 1
                else:
                    matrix[u_idx, j] = 1
                    matrix[v_idx, j] = 1
        return matrix.tolist()
    
    def get_adjacency_list(self):
        adj_list = []
        for n_id in sorted(self.G.nodes()):
            label = self.G.nodes[n_id].get('label', f"v{n_id}")
            neighbors = self.G.neighbors(n_id)
            neighbor_labels = [self.G.nodes[nb].get('label', nb) for nb in neighbors]
            adj_list.append({
                'vertex': label,
                'neighbors': ", ".join(neighbor_labels) if neighbor_labels else "—"
            })
        return adj_list

    def get_degrees_info(self):
        degree_list = []
        degrees_values = []
        for n_id, data in self.G.nodes(data=True):
            label = data.get('label', f"v{n_id}")
            if self.is_directed:
                in_deg, out_deg = self.G.in_degree(n_id), self.G.out_degree(n_id)
                degree_list.append({'label': label, 'in_degree': in_deg, 'out_degree': out_deg, 'total': in_deg + out_deg})
                degrees_values.append((in_deg, out_deg))
            else:
                deg = self.G.degree(n_id)
                degree_list.append({'label': label, 'degree': deg})
                degrees_values.append(deg)
        is_regular = all(d == degrees_values[0] for d in degrees_values) if degrees_values else False
        return degree_list, is_regular
    
    def _get_edges_for_path(self, path_nodes):
        edge_ids = []
        if not path_nodes or len(path_nodes) < 2: return []
        for i in range(len(path_nodes) - 1):
            u, v = path_nodes[i], path_nodes[i+1]
            edges_data = self.G.get_edge_data(u, v)
            if edges_data:
                first_key = list(edges_data.keys())[0]
                edge_ids.append(edges_data[first_key].get('edge_id'))
        return edge_ids

    def get_cycle_info(self):
        res = {"has_cycle": "Ні", "girth": "—", "cycle_path": [], "cycle_edges": []}
        if not self.G.nodes: return res
        try:
            shortest_cycle = []
            try:
                loop_node = next(nx.nodes_with_selfloops(self.G))
                shortest_cycle = [loop_node, loop_node]
                res["girth"] = 1
            except StopIteration:
                pass
            if not shortest_cycle and not self.is_directed:
                for u in self.G.nodes():
                    for v in self.G.neighbors(u):
                        if self.G.number_of_edges(u, v) > 1:
                            shortest_cycle = [u, v, u]
                            res["girth"] = 2
                            break
                    if shortest_cycle: break
            if not shortest_cycle:
                try:
                    if self.is_directed:
                        cycles = sorted(list(nx.simple_cycles(self.G)), key=len)
                        if cycles:
                            shortest_cycle = cycles[0]
                            shortest_cycle.append(shortest_cycle[0])
                            res["girth"] = len(shortest_cycle) - 1
                    else:
                        simple_G = nx.Graph(self.G)
                        basis = nx.minimum_cycle_basis(simple_G)
                        if basis:
                            basis.sort(key=len)
                            shortest_cycle = basis[0]
                            shortest_cycle.append(shortest_cycle[0])
                            res["girth"] = len(shortest_cycle) - 1
                except Exception:
                    pass
            if shortest_cycle:
                res["has_cycle"] = "Так"
                labels = [self.G.nodes[n].get('label', n) for n in shortest_cycle]
                res["cycle_path"] = labels
                res["cycle_edges"] = self._get_edges_for_path(shortest_cycle)
            return res
        except Exception as e:
            print(f"Cycle error: {e}")
            return res

    def get_connectivity_info(self):
        res = {'components_count': 0, 'vertex_connectivity': 0, 'edge_connectivity': 0}
        if not self.G.nodes: return res
        res['components_count'] = (
            nx.number_weakly_connected_components(self.G) 
            if self.is_directed else nx.number_connected_components(self.G)
        )
        try:
            simple_ug = nx.Graph(self.G.to_undirected())
            simple_ug.remove_edges_from(nx.selfloop_edges(simple_ug))
            multi_ug = self.G.to_undirected()
            multi_ug.remove_edges_from(nx.selfloop_edges(multi_ug))
            if nx.is_connected(simple_ug):
                res['vertex_connectivity'] = nx.node_connectivity(simple_ug)
                res['edge_connectivity'] = nx.edge_connectivity(multi_ug)
            else:
                res['vertex_connectivity'] = 0
                res['edge_connectivity'] = 0
        except Exception as e:
            print(f"Connectivity calculation error: {e}")
            pass
        return res

    def get_all_properties(self):
        degrees, is_regular = self.get_degrees_info()
        cycle_info = self.get_cycle_info()
        return {
            'adjacency_matrix': self.get_adjacency_matrix(),
            'incidence_matrix': self.get_incidence_matrix(),
            'adjacency_list': self.get_adjacency_list(),
            'degrees': degrees,
            'is_regular': is_regular,
            'connectivity': self.get_connectivity_info(),
            'is_directed': self.is_directed,
            'has_cycle': cycle_info['has_cycle'],
            'girth': cycle_info['girth'],
            'cycle_path': cycle_info['cycle_path'],
            'cycle_edges': cycle_info['cycle_edges']
        }