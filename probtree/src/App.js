import React, { useState } from 'react';

const ProbabilityNode = ({ node, onUpdate, onAdd, onRemove, onToggle, level = 0 }) => {
  const handleProbabilityChange = (e) => {
    onUpdate({ ...node, probability: parseFloat(e.target.value) });
  };

  const handleNameChange = (e) => {
    onUpdate({ ...node, name: e.target.value });
  };

  return (
    <div style={{ marginBottom: '10px', marginLeft: `${level * 20}px` }}>
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f0f0', padding: '5px', borderRadius: '4px' }}>
        <button onClick={() => onToggle(node.id)} style={{ marginRight: '10px' }}>
          {node.expanded ? '▼' : '►'}
        </button>
        <input
          type="text"
          value={node.name}
          onChange={handleNameChange}
          style={{ marginRight: '10px', padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="number"
          value={node.probability}
          onChange={handleProbabilityChange}
          min="0"
          max="100"
          step="0.1"
          style={{ width: '60px', marginRight: '5px', padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <span style={{ marginRight: '10px' }}>%</span>
        <button onClick={() => onAdd(node.id)} style={{ marginRight: '5px' }}>+</button>
        {level > 0 && <button onClick={() => onRemove(node.id)}>-</button>}
      </div>
      {node.children && node.expanded && (
        <div>
          {node.children.map((child) => (
            <ProbabilityNode
              key={child.id}
              node={child}
              onUpdate={onUpdate}
              onAdd={onAdd}
              onRemove={onRemove}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const HierarchicalVisualization = ({ node, parentProbability = 100, depth = 0 }) => {
  const actualProbability = (node.probability * parentProbability) / 100;
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
  const bgColor = colors[depth % colors.length];

  return (
    <div style={{ marginBottom: '10px' }}>
      <div
        style={{
          backgroundColor: bgColor,
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          width: `${actualProbability}%`,
          marginLeft: `${depth * 20}px`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ fontWeight: 'bold' }}>{node.name}</div>
        <div>{actualProbability.toFixed(2)}%</div>
      </div>
      {node.children && node.children.map(child => (
        <HierarchicalVisualization
          key={child.id}
          node={child}
          parentProbability={actualProbability}
          depth={depth + 1}
        />
      ))}
    </div>
  );
};

const ProbabilityDistributionVisualizer = () => {
  const [rootNode, setRootNode] = useState({
    id: 'root',
    name: 'Beliefs on the causes of an airplane crash',
    probability: 100,
    expanded: true,
    children: [
      { 
        id: '1', 
        name: 'Plane malfunction', 
        probability: 25, 
        expanded: true,
        children: [
          { id: '1-1', name: 'Engine failure', probability: 40, expanded: false },
          { id: '1-2', name: 'Structural issue', probability: 30, expanded: false },
          { id: '1-3', name: 'Electrical system', probability: 30, expanded: false },
        ]
      },
      { id: '2', name: 'Pilot error', probability: 25, expanded: false },
      { id: '3', name: 'Terrorist attack', probability: 25, expanded: false },
      { id: '4', name: '3rd party intervention', probability: 25, expanded: false },
    ],
  });

  const updateNode = (updatedNode) => {
    const updateNodeRecursive = (node) => {
      if (node.id === updatedNode.id) {
        return updatedNode;
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNodeRecursive),
        };
      }
      return node;
    };

    setRootNode(updateNodeRecursive(rootNode));
  };

  const addChild = (parentId) => {
    const addChildRecursive = (node) => {
      if (node.id === parentId) {
        const newChild = {
          id: Date.now().toString(),
          name: 'New cause',
          probability: 0,
          expanded: false,
        };
        return {
          ...node,
          children: [...(node.children || []), newChild],
          expanded: true,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(addChildRecursive),
        };
      }
      return node;
    };

    setRootNode(addChildRecursive(rootNode));
  };

  const removeNode = (nodeId) => {
    const removeNodeRecursive = (node) => {
      if (node.children) {
        return {
          ...node,
          children: node.children.filter((child) => child.id !== nodeId).map(removeNodeRecursive),
        };
      }
      return node;
    };

    setRootNode(removeNodeRecursive(rootNode));
  };

  const toggleNode = (nodeId) => {
    const toggleNodeRecursive = (node) => {
      if (node.id === nodeId) {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(toggleNodeRecursive),
        };
      }
      return node;
    };

    setRootNode(toggleNodeRecursive(rootNode));
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Probability Distribution Visualizer</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Input</h2>
          <ProbabilityNode
            node={rootNode}
            onUpdate={updateNode}
            onAdd={addChild}
            onRemove={removeNode}
            onToggle={toggleNode}
          />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Visualization</h2>
          <HierarchicalVisualization node={rootNode} />
        </div>
      </div>
    </div>
  );
};

export default ProbabilityDistributionVisualizer;