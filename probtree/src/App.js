import React, { useState, useEffect } from 'react';

const ProbabilityNode = ({ node, onUpdate, onAdd, onRemove, onToggle, level = 0, onNormalize, parentProbability, isAbsolute }) => {
  const [isNormalized, setIsNormalized] = useState(true);

  useEffect(() => {
    if (node.children) {
      const sum = node.children.reduce((acc, child) => acc + child.probability, 0);
      setIsNormalized(Math.abs(sum - (isAbsolute ? node.probability : 100)) < 0.01);
    }
  }, [node, isAbsolute]);

  const handleProbabilityChange = (e) => {
    let newProb = parseFloat(e.target.value);
    if (isAbsolute) {
      newProb = Math.min(newProb, parentProbability);
    } else {
      newProb = Math.min(newProb, 100);
    }
    onUpdate({ ...node, probability: newProb });
  };

  const displayProbability = isAbsolute 
    ? node.probability 
    : level === 0 ? 100 : (node.probability / parentProbability) * 100;

  return (
    <div style={{ marginBottom: '10px', marginLeft: `${level * 20}px` }}>
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f0f0', padding: '5px', borderRadius: '4px' }}>
        <button onClick={() => onToggle(node.id)} style={{ marginRight: '10px' }}>
          {node.expanded ? '▼' : '►'}
        </button>
        <input
          type="text"
          value={node.name}
          onChange={(e) => onUpdate({ ...node, name: e.target.value })}
          style={{ marginRight: '10px', padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="number"
          value={displayProbability.toFixed(2)}
          onChange={handleProbabilityChange}
          min="0"
          max={isAbsolute ? parentProbability : 100}
          step="0.1"
          style={{ width: '60px', marginRight: '5px', padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <span style={{ marginRight: '10px' }}>%</span>
        <button onClick={() => onAdd(node.id)} style={{ marginRight: '5px' }}>+</button>
        {level > 0 && <button onClick={() => onRemove(node.id)}>-</button>}
        {node.children && (
          <button onClick={() => onNormalize(node.id)} style={{ marginLeft: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>
            Normalize
          </button>
        )}
      </div>
      {node.children && !isNormalized && (
        <div style={{ color: 'red', marginTop: '5px' }}>
          Warning: Child probabilities do not sum to {isAbsolute ? node.probability.toFixed(2) : '100'}%
        </div>
      )}
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
              onNormalize={onNormalize}
              level={level + 1}
              parentProbability={node.probability}
              isAbsolute={isAbsolute}
            />
          ))}
        </div>
      )}
    </div>
  );
};

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

const ProbabilityDistributionVisualizer = () => {
  const [isAbsolute, setIsAbsolute] = useState(false);
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
          { id: '1-1', name: 'Engine failure', probability: 10, expanded: false },
          { id: '1-2', name: 'Structural issue', probability: 7.5, expanded: false },
          { id: '1-3', name: 'Electrical system', probability: 7.5, expanded: false },
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

  const normalizeNode = (nodeId) => {
    const normalizeNodeRecursive = (node) => {
      if (node.id === nodeId && node.children) {
        const sum = node.children.reduce((acc, child) => acc + child.probability, 0);
        const normalizedChildren = node.children.map(child => ({
          ...child,
          probability: isAbsolute ? (child.probability / sum) * node.probability : (child.probability / sum) * 100
        }));
        return { ...node, children: normalizedChildren };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(normalizeNodeRecursive),
        };
      }
      return node;
    };

    setRootNode(normalizeNodeRecursive(rootNode));
  };

  const toggleAbsolute = () => {
    const toggleAbsoluteRecursive = (node, parentProbability = 100) => {
      let newProbability;
      if (isAbsolute) {
        // Switching to relative
        newProbability = node.id === 'root' ? 100 : (node.probability / parentProbability) * 100;
      } else {
        // Switching to absolute
        newProbability = node.id === 'root' ? 100 : (node.probability / 100) * parentProbability;
      }
      
      if (node.children) {
        return {
          ...node,
          probability: newProbability,
          children: node.children.map(child => toggleAbsoluteRecursive(child, newProbability))
        };
      }
      return { ...node, probability: newProbability };
    };

    setRootNode(toggleAbsoluteRecursive(rootNode));
    setIsAbsolute(!isAbsolute);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Probability Distribution Visualizer</h1>
      <div style={{ marginBottom: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={isAbsolute}
            onChange={toggleAbsolute}
          />
          Use Absolute Probabilities
        </label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Input</h2>
          <ProbabilityNode
            node={rootNode}
            onUpdate={updateNode}
            onAdd={addChild}
            onRemove={removeNode}
            onToggle={toggleNode}
            onNormalize={normalizeNode}
            parentProbability={100}
            isAbsolute={isAbsolute}
          />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Visualization</h2>
          <HierarchicalVisualization node={rootNode} isAbsolute={isAbsolute} />
        </div>
      </div>
    </div>
  );
};

export default ProbabilityDistributionVisualizer;