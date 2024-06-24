import React, { useState } from 'react';
import { TreeMap, ResponsiveContainer } from 'recharts';
import { PlusCircle, MinusCircle, ChevronRight, ChevronDown } from 'lucide-react';

const ProbabilityNode = ({ node, onUpdate, onAdd, onRemove, onToggle, level = 0 }) => {
  const handleProbabilityChange = (e) => {
    onUpdate({ ...node, probability: parseFloat(e.target.value) });
  };

  const handleNameChange = (e) => {
    onUpdate({ ...node, name: e.target.value });
  };

  return (
    <div className="mb-2">
      <div className="flex items-center">
        {node.children && (
          <button onClick={() => onToggle(node.id)} className="mr-2">
            {node.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        <input
          type="text"
          value={node.name}
          onChange={handleNameChange}
          className="mr-2 p-1 border rounded"
        />
        <input
          type="number"
          value={node.probability}
          onChange={handleProbabilityChange}
          min="0"
          max="100"
          step="0.1"
          className="w-20 mr-2 p-1 border rounded"
        />
        <span className="mr-2">%</span>
        <button onClick={() => onAdd(node.id)} className="mr-2">
          <PlusCircle size={16} />
        </button>
        {level > 0 && (
          <button onClick={() => onRemove(node.id)}>
            <MinusCircle size={16} />
          </button>
        )}
      </div>
      {node.children && node.expanded && (
        <div className="ml-8">
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

const ProbabilityDistributionVisualizer = () => {
  const [rootNode, setRootNode] = useState({
    id: 'root',
    name: 'Beliefs on the causes of an airplane crash',
    probability: 100,
    expanded: true,
    children: [
      { id: '1', name: 'Plane malfunction', probability: 25, expanded: false },
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

  const flattenTree = (node, data = []) => {
    data.push({
      name: node.name,
      size: node.probability,
      id: node.id,
    });
    if (node.children) {
      node.children.forEach((child) => flattenTree(child, data));
    }
    return data;
  };

  const treeMapData = {
    name: 'root',
    children: flattenTree(rootNode),
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Probability Distribution Visualizer</h1>
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 pr-4">
          <h2 className="text-xl font-semibold mb-2">Input</h2>
          <ProbabilityNode
            node={rootNode}
            onUpdate={updateNode}
            onAdd={addChild}
            onRemove={removeNode}
            onToggle={toggleNode}
          />
        </div>
        <div className="w-full md:w-1/2 pl-4">
          <h2 className="text-xl font-semibold mb-2">Visualization</h2>
          <ResponsiveContainer width="100%" height={400}>
            <TreeMap
              data={treeMapData}
              dataKey="size"
              ratio={4 / 3}
              stroke="#fff"
              fill="#8884d8"
              content={({ root, depth, x, y, width, height, index, payload, colors, rank, name }) => {
                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      style={{
                        fill: depth < 2 ? colors[Math.floor((index / root.children.length) * 6)] : 'none',
                        stroke: '#fff',
                        strokeWidth: 2 / (depth + 1e-10),
                        strokeOpacity: 1 / (depth + 1e-10),
                      }}
                    />
                    {depth === 1 && (
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + 7}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={14}
                      >
                        {name}
                      </text>
                    )}
                    {depth === 1 && (
                      <text
                        x={x + width / 2}
                        y={y + height / 2 - 7}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={16}
                        fontWeight="bold"
                      >
                        {`${payload.size}%`}
                      </text>
                    )}
                  </g>
                );
              }}
            />
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProbabilityDistributionVisualizer;
