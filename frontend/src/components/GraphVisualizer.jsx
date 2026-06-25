import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const GraphVisualizer = ({ data, w, h, onNodeClick, selectedNodeId, routeLinks, mstLinks, filter }) => {
  const fgRef = useRef();

  // Highlight logic
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);

  // Parse path and mst
  useEffect(() => {
    const routeSet = new Set();
    const nodeSet = new Set();
    
    if (routeLinks && routeLinks.length > 0) {
      routeLinks.forEach(link => {
        routeSet.add(`${link.source}-${link.target}`);
        routeSet.add(`${link.target}-${link.source}`); // undirected
        nodeSet.add(link.source);
        nodeSet.add(link.target);
      });
    } else if (mstLinks && mstLinks.length > 0) {
      mstLinks.forEach(link => {
        routeSet.add(`${link.source}-${link.target}`);
        routeSet.add(`${link.target}-${link.source}`); // undirected
        nodeSet.add(link.source);
        nodeSet.add(link.target);
      });
    }

    setHighlightLinks(routeSet);
    setHighlightNodes(nodeSet);
  }, [routeLinks, mstLinks]);

  // Adjust zoom to fit
  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current.zoomToFit(400, 50);
      }, 500);
    }
  }, [data]);

  const paintNode = useCallback((node, ctx, globalScale) => {
    const isSelected = selectedNodeId === node.id;
    const isHovered = hoverNode === node.id;
    const isPathNode = highlightNodes.has(node.id);

    const radius = 10;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

    if (isSelected) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
    } else if (isPathNode) {
      ctx.fillStyle = '#0a0c10';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
    } else if (isHovered) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1;
    } else {
      ctx.fillStyle = '#1a2035';
      ctx.strokeStyle = '#1e2535';
      ctx.lineWidth = 1;
    }

    ctx.fill();
    ctx.stroke();

    // Text Label
    const label = `${node.id}`;
    const fontSize = 8;
    ctx.font = `${fontSize}px Share Tech Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelected || isPathNode ? '#00e5ff' : '#64748b';
    ctx.fillText(label, node.x, node.y);
  }, [selectedNodeId, hoverNode, highlightNodes]);

  const paintLink = useCallback((link, ctx, globalScale) => {
    const isRoute = highlightLinks.has(`${link.source.id ?? link.source}-${link.target.id ?? link.target}`);
    const isMst = mstLinks && mstLinks.length > 0 && isRoute;

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);

    if (isRoute && !mstLinks?.length) {
      ctx.strokeStyle = '#00e5ff'; 
      ctx.lineWidth = 3 / globalScale;
    } else if (isMst) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3 / globalScale;
    } else {
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1 / globalScale;
    }
    
    ctx.stroke();
  }, [highlightLinks, mstLinks]);

  return (
    <ForceGraph2D
      ref={fgRef}
      width={w}
      height={h}
      graphData={data}
      nodeCanvasObject={paintNode}
      linkCanvasObject={paintLink}
      backgroundColor="#0a0c10"
      onNodeClick={(node) => onNodeClick(node)}
      onNodeHover={(node) => setHoverNode(node ? node.id : null)}
      d3Force="charge"
      d3AlphaDecay={0.05}
      d3VelocityDecay={0.1}
      cooldownTicks={100}
    />
  );
};

export default GraphVisualizer;
