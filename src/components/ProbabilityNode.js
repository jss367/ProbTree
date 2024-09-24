
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
      onUpdate({ ...node, probability: clampedProb });
    }
  };

  const displayProbability = isAbsolute
    ? node.probability
    : level === 0 ? 100 : node.probability;

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
          value={inputValue}
          onChange={handleProbabilityChange}
          onBlur={() => setInputValue(displayProbability.toFixed(2))}
          min="0"
          max={isAbsolute ? parentProbability : 100}
          step="any"
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

export default ProbabilityNode;
