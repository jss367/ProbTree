import React, { useState, useRef, useCallback } from 'react';
import { toPng, toBlob } from 'html-to-image';

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const MIN_ITEM_WIDTH = 150; // Minimum pixels per item for readability
const GAP = 4; // Gap between items in pixels

// Calculate pixel widths bottom-up so parents always cover their children
const calculateWidths = (node, parentProb = 100, baseWidth = 1200) => {
  const proportionalWidth = (node.probability / parentProb) * baseWidth;

  if (!node.children || node.children.length === 0) {
    // Leaf node: use minimum width if needed
    return {
      ...node,
      pixelWidth: Math.max(proportionalWidth, MIN_ITEM_WIDTH)
    };
  }

  // Calculate children widths first (bottom-up)
  const childrenWithWidths = node.children.map(child =>
    calculateWidths(child, node.probability, proportionalWidth)
  );

  // Sum of children widths + gaps
  const childrenTotalWidth = childrenWithWidths.reduce((sum, child) => sum + child.pixelWidth, 0)
    + (childrenWithWidths.length - 1) * GAP;

  // Parent width must be at least as wide as children, or its proportional width, or minimum
  const nodeWidth = Math.max(proportionalWidth, childrenTotalWidth, MIN_ITEM_WIDTH);

  // If parent expanded, redistribute extra space to children proportionally
  let finalChildren = childrenWithWidths;
  if (nodeWidth > childrenTotalWidth) {
    const extraSpace = nodeWidth - childrenTotalWidth;
    const childrenProportionalSum = childrenWithWidths.reduce((sum, c) => sum + c.probability, 0);
    finalChildren = childrenWithWidths.map(child => ({
      ...child,
      pixelWidth: child.pixelWidth + (child.probability / childrenProportionalSum) * extraSpace
    }));
  }

  return {
    ...node,
    pixelWidth: nodeWidth,
    children: finalChildren
  };
};

// Flatten tree with calculated widths into levels
const flattenToLevels = (node, level = 0, levels = []) => {
  if (!levels[level]) levels[level] = [];

  if (node.id !== 'root') {
    levels[level].push({
      id: node.id,
      name: node.name,
      probability: node.probability,
      pixelWidth: node.pixelWidth
    });
  }

  if (node.children) {
    const childLevel = node.id === 'root' ? level : level + 1;
    node.children.forEach(child => {
      flattenToLevels(child, childLevel, levels);
    });
  }

  return levels;
};

const HierarchicalVisualization = ({ node, isAbsolute }) => {
  const [zoom, setZoom] = useState(0.6);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.3));
  const handleReset = () => { setZoom(0.6); setPan({ x: 0, y: 0 }); };

  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom(z => Math.min(Math.max(z + delta, 0.3), 2));
    }
  }, []);

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

  // Calculate widths bottom-up, then flatten to levels
  const treeWithWidths = calculateWidths(node, 100, 1200);
  const levels = flattenToLevels(treeWithWidths);
  const totalWidth = treeWithWidths.pixelWidth || 1200;

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary btn-sm" onClick={handleZoomOut}>−</button>
        <span style={{ fontSize: '13px', color: '#6b7280', minWidth: '50px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <button className="btn btn-secondary btn-sm" onClick={handleZoomIn}>+</button>
        <button className="btn btn-secondary btn-sm" onClick={handleReset}>Reset</button>
        <div style={{ borderLeft: '1px solid #e5e7eb', height: '20px', margin: '0 8px' }} />
        <button className="btn btn-secondary btn-sm" onClick={handleSave}>Save Image</button>
        <button className="btn btn-secondary btn-sm" onClick={handleCopy}>Copy</button>
        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>Drag to pan • Ctrl+scroll to zoom</span>
      </div>
      <div
        ref={containerRef}
        style={{
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          background: '#f9fafb',
          cursor: isPanning ? 'grabbing' : 'grab',
          minHeight: '300px'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            padding: '16px'
          }}
        >
          <div ref={contentRef} style={{ width: totalWidth }}>
            {/* Title row */}
            <div style={{
              background: '#1f2937',
              color: 'white',
              padding: '16px 20px',
              borderRadius: '8px',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>{node.name}</div>
            </div>

            {/* Level rows */}
            {levels.map((level, levelIndex) => (
              <div key={levelIndex} style={{ display: 'flex', marginBottom: '8px', gap: `${GAP}px` }}>
                {level.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      width: `${item.pixelWidth}px`,
                      backgroundColor: colors[levelIndex % colors.length],
                      color: 'white',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      flexShrink: 0,
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{item.name}</div>
                    <div style={{ fontSize: '13px', opacity: 0.9 }}>{item.probability.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HierarchicalVisualization;
