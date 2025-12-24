import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { format, differenceInDays } from 'date-fns';
import {
  LayoutGrid,
  Network
} from 'lucide-react';

interface BubbleNode extends d3.SimulationNodeDatum {
  id: string;
  r: number;
  story: Story;
  group: string;
  color: string;
  emoji: string;
  isEnded?: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<BubbleNode> {
  source: string | BubbleNode;
  target: string | BubbleNode;
  value: number;
}

// Lighter/Brighter colors for better visibility on dark backgrounds
const CATEGORY_COLORS: Record<string, string> = {
  relationship: '#f472b6', // Pink-400 (Lighter than red)
  career: '#60a5fa',       // Blue-400
  travel: '#c084fc',       // Purple-400
  family: '#4ade80',       // Green-400
  life: '#fbbf24',         // Amber-400
  other: '#94a3b8',        // Slate-400
};

const CATEGORY_EMOJIS: Record<string, string> = {
  relationship: '❤️',
  career: '💼',
  travel: '✈️',
  family: '👨‍👩‍👧',
  life: '🌟',
  other: '📌',
};

// Helper to get emoji for a story
const getStoryEmoji = (story: Story): string => {
  // Check specific relationship status
  if (story.tags.includes('relationship')) {
    // Check if it's an "Ended" relationship (based on story data or your specific logic)
    // You mentioned "broken heart" for ended.
    if (story.tags.includes('end')) {
      return '💔';
    }
    return '❤️';
  }

  // Check tags for other mappings
  if (story.tags.some(t => ['travel', 'trip', 'holiday'].includes(t))) return '✈️';
  if (story.tags.some(t => ['work', 'job', 'career'].includes(t))) return '💼';
  if (story.tags.some(t => ['house', 'home', 'move'].includes(t))) return '🏠';

  // Fallback to category default
  const cat = story.tags[0] || 'other';
  return CATEGORY_EMOJIS[cat] || '📌';
};

export const BubbleTimeline: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { stories, relationships } = useTimelineStore();
  const [viewMode, setViewMode] = useState<'bubble' | 'graph'>('bubble');
  const [hoveredNode, setHoveredNode] = useState<BubbleNode | null>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // 1. Process Data into Nodes
  const data = useMemo(() => {
    // Build a map of durations from relationships data
    const personDurations: Map<string, number> = new Map();
    relationships.forEach(rel => {
      if (rel.startDate) {
        const endDate = rel.endDate ? new Date(rel.endDate) : new Date();
        const days = differenceInDays(endDate, new Date(rel.startDate));
        personDurations.set(rel.fullName.toLowerCase(), Math.max(1, days));
      }
    });

    // Connect stories that share people or specific tags
    const nodes: BubbleNode[] = stories.map(story => {
      // Size Calculation: Based on Duration
      let durationDays = 1; // Default min size

      // First check if story has endDate directly
      if (story.endDate) {
        durationDays = differenceInDays(new Date(story.endDate), new Date(story.date));
        if (durationDays < 1) durationDays = 1;
      } else if (story.tags.includes('relationship') && story.people.length > 0) {
        // For relationship events, look up duration from relationships data
        for (const person of story.people) {
          const duration = personDurations.get(person.toLowerCase());
          if (duration && duration > durationDays) {
            durationDays = duration;
          }
        }
      }

      // Scale: Logarithmic for better visual distribution
      // 1 day = 15px, 365 days (1yr) ~= 44px, 3650 days (10yr) ~= 105px (capped at 80)
      const radius = Math.min(80, 15 + Math.sqrt(durationDays) * 1.0);

      const category = story.tags.find(t => CATEGORY_COLORS[t]) || 'other';
      const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

      return {
        id: story.id,
        r: radius,
        story,
        group: category,
        color,
        emoji: getStoryEmoji(story),
        isEnded: story.tags.includes('end')
      };
    });

    const links: GraphLink[] = [];

    // Simple Link Logic: Link sequential stories or stories with same people
    // (This creates the "Obsidian" web effect)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        // Link if they share a person
        const sharedPeople = nodeA.story.people.filter(p => nodeB.story.people.includes(p));
        if (sharedPeople.length > 0) {
          links.push({ source: nodeA.id, target: nodeB.id, value: 1 });
        }
      }
    }

    return { nodes, links };
  }, [stories, relationships]);

  // 2. Render Simulation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 600;
    setContainerHeight(height);

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height].join(' '));

    // Graph Group (Zoomable)
    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    // --- FORCE SIMULATION ---
    const simulation = d3.forceSimulation<BubbleNode>(data.nodes)
      .force("charge", d3.forceManyBody().strength(viewMode === 'graph' ? -200 : -50)) // Stronger repel in graph mode
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<BubbleNode>().radius(d => d.r + 2).iterations(2));

    if (viewMode === 'graph') {
      simulation.force("link", d3.forceLink<BubbleNode, GraphLink>(data.links).id(d => d.id).distance(100).strength(0.1));
    }

    // --- RENDER LINKS (Graph Mode Only) ---
    let link: d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown> | undefined;
    if (viewMode === 'graph') {
      link = g.append("g")
        .attr("stroke", "#475569") // Slate-600
        .attr("stroke-opacity", 0.4)
        .selectAll<SVGLineElement, GraphLink>("line")
        .data(data.links)
        .join("line")
        .attr("stroke-width", 1);
    }

    // --- RENDER NODES ---
    const node = g.append("g")
      .selectAll<SVGGElement, BubbleNode>("g")
      .data(data.nodes)
      .join("g")
      .call(d3.drag<SVGGElement, BubbleNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node Circles
    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => viewMode === 'graph' ? '#1e293b' : d.color) // Dark bubbles in graph mode (Obsidian style)
      .attr("stroke", d => d.color)
      .attr("stroke-width", viewMode === 'graph' ? 2 : 0)
      .attr("opacity", viewMode === 'graph' ? 1 : 0.8)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => setHoveredNode(d))
      .on("mouseout", () => setHoveredNode(null));

    // Node Emojis (Centered)
    node.append("text")
      .text(d => d.emoji)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", d => `${Math.max(12, d.r * 0.8)}px`) // Scale emoji with bubble
      .style("pointer-events", "none")
      .style("filter", "drop-shadow(0px 2px 2px rgba(0,0,0,0.3))"); // Shadow for visibility

    // Simulation Tick
    simulation.on("tick", () => {
      if (viewMode === 'graph' && link) {
        link
          .attr("x1", d => (d.source as BubbleNode).x!)
          .attr("y1", d => (d.source as BubbleNode).y!)
          .attr("x2", d => (d.target as BubbleNode).x!)
          .attr("y2", d => (d.target as BubbleNode).y!);
      }

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, BubbleNode, BubbleNode>, d: BubbleNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, BubbleNode, BubbleNode>, d: BubbleNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, BubbleNode, BubbleNode>, d: BubbleNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, viewMode]);

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg flex flex-col border border-theme" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
      {/* Header / Controls */}
      <div className="p-4 border-b border-theme flex justify-between items-center bg-theme-secondary/30">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-theme-primary">
            {viewMode === 'bubble' ? 'Time Bubbles' : 'Knowledge Graph'}
          </h2>

          {/* View Switcher */}
          <div className="flex bg-theme-tertiary p-1 rounded-lg">
            <button
              onClick={() => setViewMode('bubble')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'bubble'
                ? 'bg-theme-primary text-theme-accent shadow-sm'
                : 'text-theme-secondary hover:text-theme-primary'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Bubble
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'graph'
                ? 'bg-theme-primary text-theme-accent shadow-sm'
                : 'text-theme-secondary hover:text-theme-primary'
                }`}
            >
              <Network className="w-4 h-4" />
              Obsidian
            </button>
          </div>
        </div>

        <div className="text-xs text-theme-tertiary hidden sm:block">
          {stories.length} memories • {data.links.length} connections
        </div>
      </div>

      {/* Visualisation Area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#0f172a] dark:bg-[#020617]"> {/* Force dark bg for contrast */}
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>

        {/* Hover Tooltip (Overlay) */}
        {hoveredNode && (
          <div className="absolute top-4 left-4 max-w-xs bg-theme-primary/95 backdrop-blur border border-theme p-4 rounded-lg shadow-xl animate-fade-in pointer-events-none">
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{hoveredNode.emoji}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-white`} style={{ backgroundColor: hoveredNode.color }}>
                {hoveredNode.group}
              </span>
            </div>
            <h3 className="font-bold text-theme-primary mb-1">{hoveredNode.story.title}</h3>
            <p className="text-xs text-theme-secondary line-clamp-2">{hoveredNode.story.content}</p>
            <div className="mt-2 text-[10px] text-theme-tertiary font-mono">
              {format(new Date(hoveredNode.story.date), 'MMM d, yyyy')}
              {hoveredNode.story.endDate && ` — ${format(new Date(hoveredNode.story.endDate), 'MMM d, yyyy')}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
