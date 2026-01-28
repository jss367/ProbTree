import React, { useState } from 'react';
import { toPng, toBlob } from 'html-to-image';

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const TreeNode = ({ node, depth = 0, parentProb = 100 }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const color = colors[depth % colors.length];
  const relativeProb = (node.probability / parentProb) * 100;

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 8px',
          borderRadius: '4px',
          cursor: hasChildren ? 'pointer' : 'default',
          userSelect: 'none'
        }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {/* Expand/collapse indicator */}
        <span style={{
          width: '16px',
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          {hasChildren ? (expanded ? '▼' : '▶') : '•'}
        </span>

        {/* Name */}
        <span style={{
          fontWeight: '500',
          fontSize: '14px',
          minWidth: '120px',
          color: '#1f2937'
        }}>
          {node.name}
        </span>

        {/* Probability bar */}
        <div style={{
          flex: 1,
          maxWidth: '200px',
          height: '16px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${relativeProb}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '4px',
            transition: 'width 0.2s'
          }} />
        </div>

        {/* Percentage */}
        <span style={{
          fontSize: '13px',
          color: '#6b7280',
          minWidth: '50px',
          textAlign: 'right'
        }}>
          {node.probability.toFixed(1)}%
        </span>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div style={{ borderLeft: `2px solid ${color}20`, marginLeft: '7px' }}>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              parentProb={node.probability}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CollapsibleTreeVisualization = ({ node, isAbsolute }) => {
  const contentRef = React.useRef(null);

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

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={handleSave}>Save Image</button>
        <button className="btn btn-secondary btn-sm" onClick={handleCopy}>Copy</button>
        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>Click items to expand/collapse</span>
      </div>
      <div
        ref={contentRef}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          background: '#f9fafb',
          padding: '16px',
          maxHeight: '500px',
          overflowY: 'auto'
        }}
      >
        {/* Title */}
        <div style={{
          fontWeight: '600',
          fontSize: '16px',
          color: '#1f2937',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {node.name}
        </div>

        {/* Tree */}
        {node.children.map(child => (
          <TreeNode key={child.id} node={child} depth={0} parentProb={100} />
        ))}
      </div>
    </div>
  );
};

export default CollapsibleTreeVisualization;
