import React, { useEffect, useState } from 'react';
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
  const [savedDistributions, setSavedDistributions] = useState([]);
  const [distributionName, setDistributionName] = useState('');
  const { user, signIn, signOut, saveDistribution, loadDistributions, shareDistribution } = useFirebase();

  useEffect(() => {
    if (user) {
      loadSavedDistributions();
    }
  }, [user]);

  const loadSavedDistributions = async () => {
    const distributions = await loadDistributions();
    setSavedDistributions(distributions);
  };

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

  const handleSaveDistribution = async () => {
    if (distributionName.trim() === '') {
      alert('Please enter a name for the distribution');
      return;
    }
    await saveDistribution(distributionName, rootNode);
    setDistributionName('');
    loadSavedDistributions();
  };

  const handleLoadDistribution = (distribution) => {
    setRootNode(distribution.data);
  };

  const handleShareDistribution = async (distributionId) => {
    const shareLink = await shareDistribution(distributionId);
    alert(`Share this link: ${shareLink}`);
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
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Save Distribution</h2>
          <input
            type="text"
            value={distributionName}
            onChange={(e) => setDistributionName(e.target.value)}
            placeholder="Enter distribution name"
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <button onClick={handleSaveDistribution}>Save</button>
        </div>
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Saved Distributions</h2>
          <ul>
            {savedDistributions.map((dist) => (
              <li key={dist.id} style={{ marginBottom: '10px' }}>
                {dist.name}
                <button onClick={() => handleLoadDistribution(dist)} style={{ marginLeft: '10px' }}>Load</button>
                <button onClick={() => handleShareDistribution(dist.id)} style={{ marginLeft: '10px' }}>Share</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProbabilityDistributionVisualizer;
