import React, { useEffect, useState, useRef } from 'react';

const OverflowMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!React.Children.toArray(children).length) return null;

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        className="btn btn-secondary btn-icon btn-sm"
        aria-label="Node actions"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '4px 8px' }}
      >
        ⋯
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          marginTop: '4px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
          minWidth: '140px',
          overflow: 'hidden'
        }}>
          {React.Children.map(children, child =>
            child ? React.cloneElement(child, {
              onClick: (e) => {
                child.props.onClick?.(e);
                setIsOpen(false);
              }
            }) : null
          )}
        </div>
      )}
    </div>
  );
};

const MenuItem = ({ onClick, children, variant = 'default' }) => {
  const styles = {
    default: { color: '#374151' },
    danger: { color: '#dc2626' },
    success: { color: '#059669' }
  };

  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        background: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: '14px',
        ...styles[variant]
      }}
      onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
      onMouseLeave={(e) => e.target.style.background = 'none'}
    >
      {children}
    </button>
  );
};

const ProbabilityNode = ({ node, onUpdate, onAdd, onRemove, onToggle, level = 0, onNormalize, parentProbability, isAbsolute }) => {
  const [isNormalized, setIsNormalized] = useState(true);
  const [inputValue, setInputValue] = useState(node.probability.toString());

  useEffect(() => {
    setInputValue(node.probability.toString());
  }, [node.probability]);

  useEffect(() => {
    if (node.children && node.children.length > 0) {
      const sum = node.children.reduce((acc, child) => acc + child.probability, 0);
      setIsNormalized(Math.abs(sum - (isAbsolute ? node.probability : 100)) < 0.01);
    } else {
      setIsNormalized(true); // No children = nothing to normalize
    }
  }, [node, isAbsolute]);

  const handleProbabilityChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const newProb = parseFloat(newValue);
    if (!isNaN(newProb)) {
      const maximum = isAbsolute ? parentProbability : 100;
      const clampedProb = Math.max(0, Math.min(newProb, maximum));
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
          style={{ visibility: node.children && node.children.length > 0 ? 'visible' : 'hidden' }}
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
            onBlur={() => setInputValue(Number(displayProbability.toFixed(2)).toString())}
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
          {(node.id !== 'root' || node.children?.length > 0) && (
            <OverflowMenu>
              {node.children && node.children.length > 0 && (
                <MenuItem onClick={() => onNormalize(node.id)} variant="success">
                  Normalize children
                </MenuItem>
              )}
              {node.id !== 'root' && (
                <MenuItem onClick={() => onRemove(node.id)} variant="danger">
                  Delete
                </MenuItem>
              )}
            </OverflowMenu>
          )}
        </div>
      </div>
      {node.children && node.children.length > 0 && !isNormalized && (
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
      {node.children && node.children.length > 0 && node.expanded && (
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
