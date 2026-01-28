import React, { useState, useRef } from 'react';
import { toPng, toBlob } from 'html-to-image';

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

// Convert polar to cartesian coordinates
const polarToCartesian = (cx, cy, r, angle) => ({
  x: cx + r * Math.cos(angle),
  y: cy + r * Math.sin(angle)
});

// Create SVG arc path
const describeArc = (cx, cy, innerR, outerR, startAngle, endAngle) => {
  // Handle full circle case
  if (endAngle - startAngle >= 2 * Math.PI - 0.001) {
    endAngle = startAngle + 2 * Math.PI - 0.001;
  }

  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    'M', outerStart.x, outerStart.y,
    'A', outerR, outerR, 0, largeArc, 1, outerEnd.x, outerEnd.y,
    'L', innerEnd.x, innerEnd.y,
    'A', innerR, innerR, 0, largeArc, 0, innerStart.x, innerStart.y,
    'Z'
  ].join(' ');
};

// Flatten tree into arcs with calculated angles
const calculateArcs = (node, depth = 0, startAngle = 0, endAngle = 2 * Math.PI, parentProb = 100) => {
  const arcs = [];

  if (node.id !== 'root') {
    arcs.push({
      id: node.id,
      name: node.name,
      probability: node.probability,
      depth,
      startAngle,
      endAngle,
      color: colors[(depth - 1) % colors.length]
    });
  }

  if (node.children && node.children.length > 0) {
    const totalChildProb = node.children.reduce((sum, c) => sum + c.probability, 0);
    let currentAngle = startAngle;

    node.children.forEach(child => {
      const childAngleSize = ((child.probability / totalChildProb) * (endAngle - startAngle));
      const childEndAngle = currentAngle + childAngleSize;

      const childArcs = calculateArcs(
        child,
        depth + 1,
        currentAngle,
        childEndAngle,
        node.probability
      );
      arcs.push(...childArcs);

      currentAngle = childEndAngle;
    });
  }

  return arcs;
};

// Get max depth of tree
const getMaxDepth = (node, depth = 0) => {
  if (!node.children || node.children.length === 0) return depth;
  return Math.max(...node.children.map(c => getMaxDepth(c, depth + 1)));
};

const SunburstVisualization = ({ node, isAbsolute }) => {
  const [hoveredArc, setHoveredArc] = useState(null);
  const contentRef = useRef(null);

  const handleSave = async () => {
    if (!contentRef.current) return;
    try {
      const dataUrl = await toPng(contentRef.current, {
        backgroundColor: '#f9fafb',
        pixelRatio: 2
      });
      const link = document.createElement('a');
      link.download = `probtree-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const handleCopy = async () => {
    if (!contentRef.current) return;
    try {
      const blob = await toBlob(contentRef.current, {
        backgroundColor: '#f9fafb',
        pixelRatio: 2
      });
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        alert('Copied to clipboard!');
      }
    } catch (err) {
      alert('Failed to copy: ' + err.message);
    }
  };

  if (!node.children || node.children.length === 0) {
    return (
      <div style={{ color: '#6b7280', padding: '20px', textAlign: 'center' }}>
        Add some beliefs to see the visualization
      </div>
    );
  }

  const maxDepth = getMaxDepth(node);
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const centerRadius = 40;
  const ringWidth = (size / 2 - centerRadius - 20) / Math.max(maxDepth, 1);

  const arcs = calculateArcs(node);

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={handleSave}>Save Image</button>
        <button className="btn btn-secondary btn-sm" onClick={handleCopy}>Copy</button>
        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>Hover over segments for details</span>
      </div>
      <div
        ref={contentRef}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          background: '#f9fafb',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Title */}
        <div style={{
          fontWeight: '600',
          fontSize: '16px',
          color: '#1f2937',
          marginBottom: '12px'
        }}>
          {node.name}
        </div>

        {/* Sunburst */}
        <svg width={size} height={size} style={{ overflow: 'visible' }}>
          {/* Center circle */}
          <circle
            cx={cx}
            cy={cy}
            r={centerRadius}
            fill="#1f2937"
          />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="12"
            fontWeight="600"
          >
            100%
          </text>

          {/* Arcs */}
          {arcs.map(arc => {
            const innerR = centerRadius + (arc.depth - 1) * ringWidth;
            const outerR = centerRadius + arc.depth * ringWidth;
            const isHovered = hoveredArc?.id === arc.id;

            return (
              <path
                key={arc.id}
                d={describeArc(cx, cy, innerR, outerR, arc.startAngle - Math.PI / 2, arc.endAngle - Math.PI / 2)}
                fill={arc.color}
                stroke="#f9fafb"
                strokeWidth="1"
                opacity={isHovered ? 1 : 0.85}
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                  filter: isHovered ? 'brightness(1.1)' : 'none'
                }}
                onMouseEnter={() => setHoveredArc(arc)}
                onMouseLeave={() => setHoveredArc(null)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredArc && (
          <div style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: hoveredArc.color,
            color: 'white',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {hoveredArc.name}: {hoveredArc.probability.toFixed(1)}%
          </div>
        )}
        {!hoveredArc && (
          <div style={{
            marginTop: '12px',
            padding: '8px 16px',
            color: '#9ca3af',
            fontSize: '14px'
          }}>
            &nbsp;
          </div>
        )}
      </div>
    </div>
  );
};

export default SunburstVisualization;
