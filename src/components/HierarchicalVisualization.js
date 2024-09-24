import React from 'react';


const HierarchicalVisualization = ({ node, depth = 0, isAbsolute }) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
  const bgColor = colors[depth % colors.length];

  return (
    <div style={{ marginBottom: '10px', width: '100%' }}>
      <div
        style={{
          backgroundColor: bgColor,
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          width: '100%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ fontWeight: 'bold' }}>{node.name}</div>
        <div>{node.probability.toFixed(2)}%</div>
      </div>
      {node.children && (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          marginTop: '5px'
        }}>
          {node.children.map(child => (
            <div key={child.id} style={{
              flex: child.probability,
              paddingRight: '5px',
              boxSizing: 'border-box'
            }}>
              <HierarchicalVisualization
                node={child}
                depth={depth + 1}
                isAbsolute={isAbsolute}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default HierarchicalVisualization;
