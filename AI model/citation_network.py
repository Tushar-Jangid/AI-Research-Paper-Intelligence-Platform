import networkx as nx
import plotly.graph_objects as go
from typing import List, Dict, Any, Tuple

class CitationNetworkGraph:
    """NetworkX and Plotly based Academic Citation & Research Theme Graph Builder."""

    def __init__(self):
        self.graph = nx.DiGraph()

    def build_network_from_papers(self, papers: List[Dict[str, Any]]):
        """Constructs a directed graph representing papers, citations, and shared themes."""
        self.graph.clear()

        # Add paper nodes
        for paper in papers:
            p_id = paper.get("doc_id", paper.get("title"))
            title = paper.get("title", p_id)
            year = paper.get("year", "2024")
            
            self.graph.add_node(
                p_id,
                title=title,
                node_type="uploaded_paper",
                year=year,
                label=title[:30] + "..." if len(title) > 30 else title
            )

        # Connect papers based on shared references or citations
        for i, p1 in enumerate(papers):
            id1 = p1.get("doc_id", p1.get("title"))
            refs1 = [r.lower() for r in p1.get("references", [])]
            t1 = p1.get("title", "").lower()

            for j, p2 in enumerate(papers):
                if i == j:
                    continue
                id2 = p2.get("doc_id", p2.get("title"))
                t2 = p2.get("title", "").lower()

                # Direct citation match check
                cited = any(t2 in r for r in refs1) if t2 else False
                if cited:
                    self.graph.add_edge(id1, id2, relationship="cites")

            # Add foundational reference nodes if missing
            for ref in p1.get("references", [])[:3]:
                ref_id = f"ref_{abs(hash(ref)) % 10000}"
                if not self.graph.has_node(ref_id):
                    self.graph.add_node(
                        ref_id,
                        title=ref[:40] + "...",
                        node_type="foundational_ref",
                        year="Prior",
                        label=ref[:25] + "..."
                    )
                self.graph.add_edge(id1, ref_id, relationship="references")

    def compute_graph_metrics(self) -> Dict[str, Any]:
        """Calculates NetworkX topological metrics."""
        if len(self.graph.nodes) == 0:
            return {"degree_centrality": {}, "pagerank": {}, "most_influential": "None"}

        degree_cent = nx.degree_centrality(self.graph)
        try:
            pagerank = nx.pagerank(self.graph, max_iter=100)
        except Exception:
            pagerank = degree_cent

        # Find most influential node
        sorted_nodes = sorted(pagerank.items(), key=lambda x: x[1], reverse=True)
        top_node_id = sorted_nodes[0][0] if sorted_nodes else "None"
        top_node_title = self.graph.nodes[top_node_id].get("title", top_node_id) if top_node_id in self.graph.nodes else "None"

        return {
            "degree_centrality": degree_cent,
            "pagerank": pagerank,
            "most_influential": top_node_title
        }

    def generate_plotly_fig(self) -> go.Figure:
        """Generates an interactive Plotly 2D network diagram."""
        if len(self.graph.nodes) == 0:
            fig = go.Figure()
            fig.update_layout(title="No paper data available to render citation graph.")
            return fig

        pos = nx.spring_layout(self.graph, seed=42, k=0.5)

        edge_x = []
        edge_y = []
        for edge in self.graph.edges():
            x0, y0 = pos[edge[0]]
            x1, y1 = pos[edge[1]]
            edge_x.extend([x0, x1, None])
            edge_y.extend([y0, y1, None])

        edge_trace = go.Scatter(
            x=edge_x, y=edge_y,
            line=dict(width=1.5, color='#888888'),
            hoverinfo='none',
            mode='lines'
        )

        node_x = []
        node_y = []
        node_text = []
        node_color = []
        node_size = []

        metrics = self.compute_graph_metrics()
        pageranks = metrics["pagerank"]

        for node in self.graph.nodes():
            x, y = pos[node]
            node_x.append(x)
            node_y.append(y)

            n_data = self.graph.nodes[node]
            title = n_data.get("title", node)
            n_type = n_data.get("node_type", "uploaded_paper")
            pr = pageranks.get(node, 0.1)

            hover_label = f"<b>{title}</b><br>Type: {n_type}<br>PageRank: {pr:.3f}"
            node_text.append(hover_label)

            if n_type == "uploaded_paper":
                node_color.append("#4F46E5")  # Indigo
                node_size.append(max(20, pr * 120))
            else:
                node_color.append("#10B981")  # Emerald Green
                node_size.append(max(12, pr * 80))

        node_trace = go.Scatter(
            x=node_x, y=node_y,
            mode='markers+text',
            hoverinfo='text',
            text=[self.graph.nodes[n].get("label", "") for n in self.graph.nodes()],
            textposition="top center",
            hovertext=node_text,
            marker=dict(
                color=node_color,
                size=node_size,
                line=dict(width=2, color='#FFFFFF')
            )
        )

        fig = go.Figure(data=[edge_trace, node_trace])
        fig.update_layout(
            title=dict(
                text="<b>Academic Citation & Conceptual Research Map</b>",
                font=dict(size=16)
            ),
            showlegend=False,
            hovermode='closest',
            margin=dict(b=20, l=20, r=20, t=50),
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)"
        )
        return fig
