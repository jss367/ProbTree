import React, { useState } from 'react';
import useFirebase from '../hooks/useFirebase';
import { addChild, normalizeNode, removeNode, toggleAbsolute, toggleNode, updateNode } from '../utils/treeUtils';
import HierarchicalVisualization from './HierarchicalVisualization';
import ProbabilityNode from './ProbabilityNode';

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
  const { user, signIn, signOut, saveDistribution, loadDistributions, shareDistribution } = useFirebase();

  const handleUpdateNode = (updatedNode) => {
    setRootNode(prevRoot => updateNode(prevRoot, updatedNode));
  };

  const handleAddChild = (parentId) => {
    setRootNode(prevRoot => addChild(prevRoot, parentId));
  };

  const handleRemoveNode = (nodeId) => {
    setRootNode(prevRoot => removeNode(prevRoot, nodeId));
  };

  const handleToggleNode = (nodeId) => {
    setRootNode(prevRoot => toggleNode(prevRoot, nodeId));
  };

  const handleNormalizeNode = (nodeId) => {
    setRootNode(prevRoot => normalizeNode(prevRoot, nodeId, isAbsolute));
  };

  const handleToggleAbsolute = () => {
    setRootNode(prevRoot => toggleAbsolute(prevRoot, !isAbsolute));
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
            onChange={handleToggleAbsolute}
          />
          Use Absolute Probabilities
        </label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Input</h2>
          <ProbabilityNode
            node={rootNode}
            onUpdate={handleUpdateNode}
            onAdd={handleAddChild}
            onRemove={handleRemoveNode}
            onToggle={handleToggleNode}
            onNormalize={handleNormalizeNode}
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
