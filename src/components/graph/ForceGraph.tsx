import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface GraphNode {
  id: string;
  title: string;
  slug: string;
  tags: string[];
  linkCount: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  basePath: string;
}

const TAG_COLORS: Record<string, string> = {
  Frontend: '#3b82f6',
  React: '#3b82f6',
  Math: '#10b981',
  Canvas: '#f59e0b',
  设计: '#8b5cf6',
  CSS: '#8b5cf6',
  SVG: '#ef4444',
  随想: '#6b7280',
};

function getColor(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  }
  return '#6b7280';
}

export default function ForceGraph({ nodes, edges, basePath }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'blur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, any>(edges).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    const edgeGroup = g.append('g');
    const link = edgeGroup.selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', 'rgba(0,0,0,0.08)')
      .attr('stroke-width', 0.5);

    const nodeGroup = g.append('g');
    const node = nodeGroup.selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append('circle')
      .attr('class', 'halo')
      .attr('r', d => Math.max(8, d.linkCount * 3 + 8))
      .attr('fill', d => getColor(d.tags))
      .attr('opacity', 0.04);

    node.append('circle')
      .attr('class', 'core')
      .attr('r', d => Math.max(2.5, d.linkCount * 0.8 + 2.5))
      .attr('fill', d => getColor(d.tags))
      .attr('filter', 'url(#glow)')
      .attr('opacity', 0.6);

    node.append('text')
      .text(d => d.title)
      .attr('dy', d => Math.max(2.5, d.linkCount * 0.8 + 2.5) + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('font-family', 'Inter, sans-serif')
      .attr('fill', 'rgba(0,0,0,0.4)')
      .attr('pointer-events', 'none');

    node.on('mouseenter', function(event, d) {
      d3.select(this).select('.core').attr('opacity', 1).attr('r', (dd: any) => Math.max(4, dd.linkCount * 0.8 + 4));
      d3.select(this).select('.halo').attr('opacity', 0.15);
      d3.select(this).select('text').attr('fill', '#1a1a1a');
      link.attr('stroke', (l: any) =>
        l.source.id === d.id || l.target.id === d.id
          ? 'rgba(16,185,129,0.4)' : 'rgba(0,0,0,0.08)'
      ).attr('stroke-width', (l: any) =>
        l.source.id === d.id || l.target.id === d.id ? 1 : 0.5
      );
    });

    node.on('mouseleave', function() {
      d3.select(this).select('.core').attr('opacity', 0.6).attr('r', (dd: any) => Math.max(2.5, dd.linkCount * 0.8 + 2.5));
      d3.select(this).select('.halo').attr('opacity', 0.04);
      d3.select(this).select('text').attr('fill', 'rgba(0,0,0,0.4)');
      link.attr('stroke', 'rgba(0,0,0,0.08)').attr('stroke-width', 0.5);
    });

    node.on('click', (event, d) => {
      setSelected(prev => prev?.id === d.id ? null : d);
    });

    node.on('dblclick', (event, d) => {
      window.location.href = `${basePath}/notes/${d.slug}`;
    });

    function breathe() {
      node.select('.core')
        .transition()
        .duration(() => 2500 + Math.random() * 2000)
        .attr('opacity', () => 0.4 + Math.random() * 0.4)
        .attr('r', (d: any) => {
          const base = Math.max(2.5, d.linkCount * 0.8 + 2.5);
          return base + Math.random() * 1.5;
        })
        .transition()
        .duration(() => 2500 + Math.random() * 2000)
        .attr('opacity', 0.6)
        .attr('r', (d: any) => Math.max(2.5, d.linkCount * 0.8 + 2.5))
        .on('end', breathe);
    }
    breathe();

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [nodes, edges, basePath]);

  const connectedNotes = selected
    ? edges
        .filter((e: any) => {
          const s = typeof e.source === 'object' ? e.source.id : e.source;
          const t = typeof e.target === 'object' ? e.target.id : e.target;
          return s === selected.id || t === selected.id;
        })
        .map((e: any) => {
          const s = typeof e.source === 'object' ? e.source : nodes.find(n => n.id === e.source);
          const t = typeof e.target === 'object' ? e.target : nodes.find(n => n.id === e.target);
          return s?.id === selected.id ? t : s;
        })
        .filter((n): n is GraphNode => !!n)
        .filter((n, i, arr) => arr.findIndex(a => a.id === n.id) === i)
    : [];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      />
      {selected && (
        <div className="graph-popover">
          <div className="graph-popover-title">{selected.title}</div>
          <div className="graph-popover-meta">
            {selected.tags.map(t => `#${t}`).join(' ')} · {selected.linkCount} links
          </div>
          {connectedNotes.length > 0 && (
            <>
              <div className="graph-popover-section">关联笔记</div>
              {connectedNotes.map(n => (
                <a key={n.id} href={`${basePath}/notes/${n.slug}`} className="graph-popover-link">
                  → {n.title}
                </a>
              ))}
            </>
          )}
          <a href={`${basePath}/notes/${selected.slug}`} className="graph-popover-btn">
            打开笔记 →
          </a>
        </div>
      )}
    </div>
  );
}
