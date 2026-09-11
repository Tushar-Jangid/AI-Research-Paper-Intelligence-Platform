from __future__ import annotations
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from loguru import logger


class CitationNetwork:
    def build(
        self,
        focal_paper_id: str,
        focal_record: Dict,
        all_records: List[Dict],
    ) -> "CitationNetworkResponse":
        try:
            import networkx as nx
        except ImportError:
            raise ImportError("Install networkx: pip install networkx")

        from backend.schemas import CitationNetworkResponse, CitationNode, CitationEdge

        graph = nx.DiGraph()
        papers_by_id    = {r["paper_id"]: r for r in all_records}
        papers_by_title = {r.get("title", "").lower(): r for r in all_records}
        graph.add_node(focal_paper_id)

        focal_refs = focal_record.get("references", [])

        edges = []
        for ref_text in focal_refs:
            matched_id = self._match_reference(ref_text, papers_by_title, focal_paper_id)
            if matched_id:
                graph.add_edge(focal_paper_id, matched_id)
                edges.append(CitationEdge(source=focal_paper_id, target=matched_id))
        for rec in all_records:
            if rec["paper_id"] == focal_paper_id:
                continue
            for ref_text in rec.get("references", []):
                focal_title = focal_record.get("title", "").lower()
                if focal_title and focal_title[:30] in ref_text.lower():
                    graph.add_edge(rec["paper_id"], focal_paper_id)
                    edges.append(CitationEdge(source=rec["paper_id"], target=focal_paper_id))
                    graph.add_node(rec["paper_id"])
        nodes = []
        for node_id in graph.nodes():
            if node_id in papers_by_id:
                rec = papers_by_id[node_id]
                nodes.append(CitationNode(
                    id=node_id,
                    title=rec.get("title", "Unknown"),
                    authors=rec.get("authors", []),
                    year=rec.get("year"),
                ))
            else:
                nodes.append(CitationNode(
                    id=node_id,
                    title=f"External Paper ({node_id[:8]})",
                    authors=[],
                    year=None,
                ))
        stats = self._compute_statistics(graph, focal_paper_id)

        logger.info(
            f"🕸️  Citation network: {len(nodes)} nodes | {len(edges)} edges"
        )

        return CitationNetworkResponse(
            paper_id=focal_paper_id,
            nodes=nodes,
            edges=edges,
            statistics=stats,
        )
    @staticmethod
    def _match_reference(
        ref_text: str,
        papers_by_title: Dict[str, Dict],
        exclude_id: str,
    ) -> Optional[str]:
        ref_lower = ref_text.lower()
        for title, rec in papers_by_title.items():
            if rec["paper_id"] == exclude_id:
                continue
            # Match first 30 chars of title against reference text
            title_snippet = title[:30].strip()
            if len(title_snippet) > 10 and title_snippet in ref_lower:
                return rec["paper_id"]
        return None

    @staticmethod
    def _compute_statistics(graph, focal_id: str) -> Dict[str, Any]:
        stats = {
            "num_nodes":      graph.number_of_nodes(),
            "num_edges":      graph.number_of_edges(),
            "focal_out_degree": graph.out_degree(focal_id) if focal_id in graph else 0,
            "focal_in_degree":  graph.in_degree(focal_id)  if focal_id in graph else 0,
        }
        return stats
