import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { format } from 'date-fns';
import { getCategoryColorForStory, LIFE_CATEGORIES, getCategoryForStory } from '../constants/categories';
import { X, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';

interface BubbleNode extends d3.SimulationNodeDatum {
  id: string;
  story: Story;
  radius: number;
  color: string;
  category: string | null;
}

// Calculate radius based on importance
const getRadiusByImportance = (importance: Story['importance']): number => {
  switch (importance) {
    case 'high': return 50;
    case 'medium': return 35;
    case 'low': return 25;
    default: return 30;
  }
};

// Get mood emoji
const getMoodEmoji = (mood: Story['mood']): string => {
  const moods: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    neutral: '😐',
    excited: '🎉',
    proud: '🏆',
    grateful: '🙏',
  };
  return moods[mood || 'neutral'] || '😐';
};

export const BubbleTimeline: React.FC = () => {
  const { stories, setCurrentView, setActiveStory } = useTimelineStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [groupByMonth, setGroupByMonth] = useState(false);
  const [scale, setScale] = useState(1); // Zoom scale factor (0.25 to 1)
  const simulationRef = useRef<d3.Simulation<BubbleNode, undefined> | null>(null);

  // Create bubble nodes from stories with scale
  const nodes: BubbleNode[] = useMemo(() => {
    return stories.map(story => ({
      id: story.id,
      story,
      radius: getRadiusByImportance(story.importance) * scale,
      color: getCategoryColorForStory(story.tags),
      category: getCategoryForStory(story.tags),
    }));
  }, [stories, scale]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(600, window.innerHeight - 200),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 Force Simulation
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Create simulation
    const simulation = d3.forceSimulation<BubbleNode>(nodes)
      .force('charge', d3.forceManyBody().strength(5))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<BubbleNode>().radius(d => d.radius + 4))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    simulationRef.current = simulation;

    // Create gradient definitions for depth effect
    const defs = svg.append('defs');

    nodes.forEach(node => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${node.id}`)
        .attr('cx', '30%')
        .attr('cy', '30%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.color(node.color)?.brighter(0.5)?.toString() || node.color);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d3.color(node.color)?.darker(0.3)?.toString() || node.color);
    });

    // Create bubble groups
    const bubbleGroups = svg.selectAll<SVGGElement, BubbleNode>('g.bubble')
      .data(nodes, d => d.id)
      .join('g')
      .attr('class', 'bubble')
      .style('cursor', 'pointer');

    // Add shadow circles
    bubbleGroups.append('circle')
      .attr('class', 'shadow')
      .attr('r', d => d.radius)
      .attr('fill', 'rgba(0,0,0,0.2)')
      .attr('transform', 'translate(3, 3)');

    // Add main circles with gradient
    bubbleGroups.append('circle')
      .attr('class', 'main')
      .attr('r', d => d.radius)
      .attr('fill', d => `url(#gradient-${d.id})`)
      .attr('stroke', d => d3.color(d.color)?.darker(0.5)?.toString() || d.color)
      .attr('stroke-width', 2);

    // Add text labels inside bubbles
    bubbleGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .attr('fill', 'white')
      .attr('font-size', d => Math.max(10, d.radius / 4))
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)')
      .text(d => d.story.title.substring(0, Math.floor(d.radius / 5)) + (d.story.title.length > Math.floor(d.radius / 5) ? '...' : ''));

    // Add mood emoji
    bubbleGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .attr('font-size', d => Math.max(14, d.radius / 3))
      .style('pointer-events', 'none')
      .text(d => getMoodEmoji(d.story.mood));

    // Click handler
    bubbleGroups.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedStory(d.story);

      // Expand clicked bubble and push others away
      d.radius = d.radius * 1.3;
      simulation.force('collision', d3.forceCollide<BubbleNode>().radius(n => n.radius + 4));
      simulation.alpha(0.5).restart();

      // Restore after delay
      setTimeout(() => {
        d.radius = getRadiusByImportance(d.story.importance);
        simulation.force('collision', d3.forceCollide<BubbleNode>().radius(n => n.radius + 4));
        simulation.alpha(0.3).restart();
      }, 800);
    });

    // Drag behavior
    const drag = d3.drag<SVGGElement, BubbleNode>()
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
      });

    bubbleGroups.call(drag);

    // Update positions on tick
    simulation.on('tick', () => {
      bubbleGroups.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    // Shuffle on click background
    svg.on('click', () => {
      simulation.alpha(0.8).restart();
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, dimensions]);

  // Close story detail
  const handleCloseDetail = () => {
    setSelectedStory(null);
  };

  // Open in viewer
  const handleViewStory = (story: Story) => {
    setActiveStory(story.id);
    setSelectedStory(null);
  };

  // Edit story
  const handleEditStory = (story: Story) => {
    setCurrentView({ type: 'edit-story', storyId: story.id });
  };

  return (
    <div className="max-w-7xl mx-auto" ref={containerRef}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-theme-primary mb-2">Bubble Timeline</h2>
        <p className="text-theme-tertiary mb-4">Click bubbles to explore • Drag to reposition • Click background to shuffle</p>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4">
          {Object.values(LIFE_CATEGORIES).map(cat => (
            <div key={cat.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: cat.color.hex }}
              />
              <span className="text-sm text-theme-secondary">{cat.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-slate-400" />
            <span className="text-sm text-theme-secondary">Other</span>
          </div>
        </div>

        {/* Size legend */}
        <div className="flex items-center gap-4 text-sm text-theme-tertiary">
          <span>Bubble size = importance:</span>
          <span className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-theme-tertiary" /> High
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-theme-tertiary" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-theme-tertiary" /> Low
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-4 mt-4 p-3 bg-theme-tertiary rounded-lg">
          <span className="text-sm font-medium text-theme-secondary">Zoom:</span>
          <button
            onClick={() => setScale(prev => Math.max(0.15, prev - 0.15))}
            className="p-2 bg-theme-primary rounded-lg hover:bg-theme-secondary transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5 text-theme-secondary" />
          </button>
          <input
            type="range"
            min="0.15"
            max="1"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-32 h-2 bg-theme-primary rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <button
            onClick={() => setScale(prev => Math.min(1, prev + 0.15))}
            className="p-2 bg-theme-primary rounded-lg hover:bg-theme-secondary transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5 text-theme-secondary" />
          </button>
          <span className="text-sm text-theme-tertiary">{Math.round(scale * 100)}%</span>
          {stories.length > 100 && scale > 0.5 && (
            <span className="text-xs text-amber-500 ml-2">
              💡 Tip: Zoom out for {stories.length} stories
            </span>
          )}
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden shadow-xl">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="block"
        />

        {/* Story count */}
        <div className="absolute top-4 right-4 bg-black/50 rounded-lg px-3 py-1">
          <span className="text-white text-sm">{stories.length} stories</span>
        </div>
      </div>

      {/* Selected Story Modal */}
      {selectedStory && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={handleCloseDetail}
        >
          <div
            className="bg-theme-primary rounded-lg shadow-2xl max-w-lg w-full p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-theme-primary">{selectedStory.title}</h3>
              <button onClick={handleCloseDetail} className="text-gray-400 hover:text-theme-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4 text-sm text-theme-tertiary">
              <span>{format(new Date(selectedStory.date), 'MMMM d, yyyy')}</span>
              {selectedStory.location && <span>• {selectedStory.location}</span>}
              <span>{getMoodEmoji(selectedStory.mood)}</span>
            </div>

            <p className="text-theme-secondary mb-4 line-clamp-4">{selectedStory.content}</p>

            {selectedStory.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedStory.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-theme-tertiary rounded-full text-xs text-theme-secondary">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleViewStory(selectedStory)}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                View Full
              </button>
              <button
                onClick={() => handleEditStory(selectedStory)}
                className="px-4 py-2 bg-theme-tertiary text-theme-primary rounded-lg hover:opacity-80 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {stories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-theme-tertiary flex items-center justify-center mb-6">
            <span className="text-4xl">🫧</span>
          </div>
          <h3 className="text-xl font-semibold text-theme-primary mb-2">No stories yet</h3>
          <p className="text-theme-tertiary mb-6">Add stories to see them as interactive bubbles</p>
          <button
            onClick={() => setCurrentView({ type: 'add-story' })}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add Your First Story
          </button>
        </div>
      )}
    </div>
  );
};
