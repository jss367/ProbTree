
import React, { useEffect, useState } from 'react';


const ProbabilityNode = ({ node, onUpdate, onAdd, onRemove, onToggle, level = 0, onNormalize, parentProbability, isAbsolute }) => {
  const [isNormalized, setIsNormalized] = useState(true);
  const [inputValue, setInputValue] = useState(node.probability.toString());

  useEffect(() => {
    setInputValue(node.probability.toString());
  }, [node.probability]);

  useEffect(() => {
    if (node.children) {
      const sum = node.children.reduce((acc, child) => acc + child.probability, 0);
      setIsNormalized(Math.abs(sum - (isAbsolute ? node.probability : 100)) < 0.01);
    }
  }, [node, isAbsolute]);

  const handleProbabilityChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const newProb = parseFloat(newValue);
    if (!isNaN(newProb)) {
      let clampedProb;
      if (isAbsolute) {
        clampedProb = Math.min(newProb, parentProbability);
      } else {
        clampedProb = Math.min(newProb, 100);
      }
      // Auto-lock when user manually changes probability
      onUpdate({ ...node, probability: clampedProb, locked: true });
    }
  };

  const handleToggleLock = () => {
    onUpdate({ ...node, locked: !node.locked });
  };

  const displayProbability = isAbsolute
    ? node.probability
    : node.id === 'root' ? 100 : node.probability;

  return (
    <div style={{ marginLeft: level > 0 ? '24px' : '0' }}>
      <div className="node-row" style={{ borderLeft: level > 0 ? '3px solid #e5e7eb' : 'none' }}>
        <button
          className="node-toggle"
          onClick={() => onToggle(node.id)}
          style={{ visibility: node.children ? 'visible' : 'hidden' }}
        >
          {node.expanded ? '▼' : '▶'}
        </button>
        <input
          className="input"
          type="text"
          value={node.name}
          onChange={(e) => onUpdate({ ...node, name: e.target.value })}
          style={{ flex: 1, minWidth: '120px' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            className="input input-sm"
            type="number"
            value={inputValue}
            onChange={handleProbabilityChange}
            onBlur={() => setInputValue(displayProbability.toFixed(2))}
            min="0"
            max={isAbsolute ? parentProbability : 100}
            step="any"
            style={{ width: '70px', textAlign: 'right' }}
          />
          <span style={{ color: '#6b7280', fontSize: '14px' }}>%</span>
          <button
            onClick={handleToggleLock}
            title={node.locked ? 'Unlock (allow normalize to change this value)' : 'Lock (preserve this value during normalize)'}
            style={{
              background: node.locked ? '#dbeafe' : 'transparent',
              border: node.locked ? '1px solid #93c5fd' : '1px solid #e5e7eb',
              borderRadius: '4px',
              padding: '4px 6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: node.locked ? '#2563eb' : '#9ca3af'
            }}
          >
            {node.locked ? '🔒' : '🔓'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => onAdd(node.id)} title="Add child">+</button>
          {node.id !== 'root' && (
            <button
              className="btn btn-icon btn-sm"
              onClick={() => onRemove(node.id)}
              title="Remove"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
            >
              −
            </button>
          )}
          {node.children && (
            <button className="btn btn-success btn-sm" onClick={() => onNormalize(node.id)}>
              Normalize
            </button>
          )}
        </div>
      </div>
      {node.children && !isNormalized && (
        <div style={{
          color: '#dc2626',
          fontSize: '13px',
          marginTop: '4px',
          marginBottom: '8px',
          marginLeft: level > 0 ? '24px' : '0',
          padding: '8px 12px',
          background: '#fef2f2',
          borderRadius: '4px',
          border: '1px solid #fecaca'
        }}>
          Children don't sum to {isAbsolute ? node.probability.toFixed(1) : '100'}%
        </div>
      )}
      {node.children && node.expanded && (
        <div style={{ marginTop: '4px' }}>
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

export default ProbabilityNode;
