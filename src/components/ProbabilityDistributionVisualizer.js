import React, { useEffect, useRef, useState } from 'react';
import useFirebase from '../hooks/useFirebase';
import { addChild, normalizeNode, removeNode, toggleAbsolute, toggleNode, updateNode } from '../utils/treeUtils';
import HierarchicalVisualization from './HierarchicalVisualization';
import ProbabilityNode from './ProbabilityNode';

const ProbabilityDistributionVisualizer = () => {
  const fileInputRef = useRef(null);
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
  const { user, saveDistribution, loadDistributions, shareDistribution } = useFirebase();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const distributions = await loadDistributions();
      setSavedDistributions(distributions);
    })();
  }, [user, loadDistributions]);

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

  const handleExport = () => {
    try {
      const payload = { isAbsolute, data: rootNode };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.href = url;
      a.download = `probability-distribution-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export: ' + err.message);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== 'object' || !obj.data || obj.data.id !== 'root') {
        alert('Invalid file format.');
        return;
      }
      if (typeof obj.isAbsolute === 'boolean') {
        setIsAbsolute(obj.isAbsolute);
      }
      setRootNode(obj.data);
    } catch (err) {
      alert('Failed to import: ' + err.message);
    } finally {
      e.target.value = '';
    }
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
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button onClick={() => handleAddChild(rootNode.id)}>Add top-level belief</button>
            {rootNode.children && rootNode.children.length > 0 && (
              <button onClick={() => handleNormalizeNode(rootNode.id)} style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>
                Normalize top-level
              </button>
            )}
          </div>
          <div>
            {rootNode.children && rootNode.children.map((child) => (
              <ProbabilityNode
                key={child.id}
                node={child}
                onUpdate={handleUpdateNode}
                onAdd={handleAddChild}
                onRemove={handleRemoveNode}
                onToggle={handleToggleNode}
                onNormalize={handleNormalizeNode}
                parentProbability={rootNode.probability}
                isAbsolute={isAbsolute}
              />
            ))}
          </div>
        </div>
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Visualization</h2>
          <HierarchicalVisualization node={rootNode} isAbsolute={isAbsolute} />
        </div>
        {user && (
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
        )}
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Import / Export</h2>
          <button onClick={handleExport} style={{ marginRight: '10px' }}>Export JSON</button>
          <button onClick={handleImportClick} style={{ marginRight: '10px' }}>Import JSON</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
        </div>
        {user && (
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
        )}
      </div>
    </div>
  );
};

export default ProbabilityDistributionVisualizer;
