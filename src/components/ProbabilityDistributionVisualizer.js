import React, { useEffect, useRef, useState } from 'react';
import useFirebase from '../hooks/useFirebase';
import { addChild, normalizeNode, removeNode, sortTree, toggleAbsolute, toggleNode, updateNode } from '../utils/treeUtils';
import HierarchicalVisualization from './HierarchicalVisualization';
import ProbabilityNode from './ProbabilityNode';
import defaultDistribution from '../samples/cat-staring-at-wall.json';

const ProbabilityDistributionVisualizer = () => {
  const fileInputRef = useRef(null);
  const [isAbsolute, setIsAbsolute] = useState(defaultDistribution.isAbsolute);
  const [rootNode, setRootNode] = useState(defaultDistribution.data);
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

  const handleSortTree = () => {
    setRootNode(prevRoot => sortTree(prevRoot));
  };

  const handleSetAbsolute = (newIsAbsolute) => {
    if (newIsAbsolute !== isAbsolute) {
      setRootNode(prevRoot => toggleAbsolute(prevRoot, newIsAbsolute));
      setIsAbsolute(newIsAbsolute);
    }
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

  // Round probabilities to avoid floating point precision issues in export
  const roundProbabilities = (node) => {
    const rounded = {
      ...node,
      probability: Math.round(node.probability * 1000) / 1000 // Round to 3 decimal places
    };
    if (node.children) {
      rounded.children = node.children.map(roundProbabilities);
    }
    return rounded;
  };

  const handleExport = () => {
    try {
      const cleanedData = roundProbabilities(rootNode);
      const payload = { isAbsolute, data: cleanedData };
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <input
          className="input"
          type="text"
          value={rootNode.name}
          onChange={(e) => handleUpdateNode({ ...rootNode, name: e.target.value })}
          style={{ fontSize: '20px', fontWeight: '600', width: '100%', maxWidth: '500px' }}
          placeholder="Enter your question..."
        />
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '24px' }}>
        <label className="checkbox-label">
          <input
            type="radio"
            name="probabilityMode"
            checked={isAbsolute}
            onChange={() => handleSetAbsolute(true)}
          />
          Absolute
        </label>
        <label className="checkbox-label">
          <input
            type="radio"
            name="probabilityMode"
            checked={!isAbsolute}
            onChange={() => handleSetAbsolute(false)}
          />
          Relative
        </label>
        <span style={{ color: '#6b7280', fontSize: '13px', alignSelf: 'center' }}>
          {isAbsolute ? '(values sum to parent)' : '(values are % of parent, sum to 100)'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Input Section */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Beliefs</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleAddChild(rootNode.id)}>
                + Add Belief
              </button>
              {rootNode.children && rootNode.children.length > 0 && (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => handleNormalizeNode(rootNode.id)}>
                    Normalize
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleSortTree}>
                    Sort
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="card-body">
            {rootNode.children && rootNode.children.length > 0 ? (
              rootNode.children.map((child) => (
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
              ))
            ) : (
              <p style={{ color: '#6b7280', margin: 0 }}>No beliefs yet. Click "Add Belief" to get started.</p>
            )}
          </div>
        </div>

        {/* Visualization Section */}
        <div className="card">
          <div className="card-header">
            <h2>Visualization</h2>
          </div>
          <div className="card-body">
            <HierarchicalVisualization node={rootNode} isAbsolute={isAbsolute} />
          </div>
        </div>

        {/* Import/Export Section */}
        <div className="card">
          <div className="card-header">
            <h2>Import / Export</h2>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleExport}>Export JSON</button>
            <button className="btn btn-secondary" onClick={handleImportClick}>Import JSON</button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Save Distribution Section (logged in only) */}
        {user && (
          <div className="card">
            <div className="card-header">
              <h2>Save to Cloud</h2>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                className="input"
                type="text"
                value={distributionName}
                onChange={(e) => setDistributionName(e.target.value)}
                placeholder="Enter distribution name"
                style={{ flex: 1, maxWidth: '300px' }}
              />
              <button className="btn btn-primary" onClick={handleSaveDistribution}>Save</button>
            </div>
          </div>
        )}

        {/* Saved Distributions Section (logged in only) */}
        {user && savedDistributions.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2>Saved Distributions</h2>
            </div>
            <div className="card-body">
              {savedDistributions.map((dist) => (
                <div key={dist.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: 500 }}>{dist.name}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleLoadDistribution(dist)}>Load</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleShareDistribution(dist.id)}>Share</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProbabilityDistributionVisualizer;
