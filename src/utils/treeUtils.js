// Sort all children recursively by probability (highest first)
export const sortTree = (node) => {
  if (!node.children || node.children.length === 0) {
    return node;
  }

  const sortedChildren = [...node.children]
    .sort((a, b) => b.probability - a.probability)
    .map(sortTree);

  return { ...node, children: sortedChildren };
};

export const updateNode = (rootNode, updatedNode) => {
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

  return updateNodeRecursive(rootNode);
};

export const addChild = (rootNode, parentId) => {
  const addChildRecursive = (node) => {
    if (node.id === parentId) {
      const newChild = {
        id: Date.now().toString(),
        name: '',
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

  return addChildRecursive(rootNode);
};

export const removeNode = (rootNode, nodeId) => {
  const removeNodeRecursive = (node) => {
    if (node.children) {
      return {
        ...node,
        children: node.children.filter((child) => child.id !== nodeId).map(removeNodeRecursive),
      };
    }
    return node;
  };

  return removeNodeRecursive(rootNode);
};

export const toggleNode = (rootNode, nodeId) => {
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

  return toggleNodeRecursive(rootNode);
};

const validateProbability = ({ name, probability }) => {
  if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
    throw new Error(`"${name}" must have a probability between 0 and 100 before rounding.`);
  }
};

// Allocate the available probability proportionally, using largest remainders
// to keep sibling totals consistent after rounding.
const roundSubtree = (node, isAbsolute, scale) => {
  if (!node.children?.length) return node;

  validateProbability(node);
  node.children.forEach(validateProbability);
  const target = isAbsolute ? node.probability : 100;
  const unlocked = node.children.filter(child => !child.locked);
  const lockedSum = node.children.reduce((sum, child) => sum + (child.locked ? child.probability : 0), 0);
  const available = Math.max(0, target - lockedSum) * scale;
  const totalWeight = unlocked.reduce((sum, child) => sum + child.probability, 0);
  const shares = unlocked.map(child => {
    const weight = totalWeight > 0 ? child.probability / totalWeight : 1 / unlocked.length;
    const quota = weight * available;
    return { child, units: Math.floor(quota), remainder: quota % 1 };
  });
  shares.sort((a, b) => b.remainder - a.remainder);

  // A fractional locked value can leave a fraction of a unit to allocate.
  let remaining = available - shares.reduce((sum, share) => sum + share.units, 0);
  const probabilities = new Map();
  for (const { child, units } of shares) {
    const extra = Math.min(1, Math.max(0, remaining));
    probabilities.set(child, Number(((units + extra) / scale).toFixed(12)));
    remaining -= extra;
  }

  return {
    ...node,
    children: node.children.map(child => {
      const updated = child.locked ? child : { ...child, probability: probabilities.get(child) };
      return roundSubtree(updated, isAbsolute, scale);
    })
  };
};

export const roundNode = (node, nodeId, isAbsolute, decimals = 0) => {
  if (node.id === nodeId) return roundSubtree(node, isAbsolute, 10 ** decimals);
  if (!node.children?.length) return node;
  return { ...node, children: node.children.map(child => roundNode(child, nodeId, isAbsolute, decimals)) };
};

export const normalizeNode = (node, nodeId, isAbsolute) => roundNode(node, nodeId, isAbsolute, 6);

// Strict variant: allocate whole percentages by largest remainder. Locked children keep their values.
export const roundTree = (node, isAbsolute) => {
  if (!node.children?.length) return node;

  validateProbability(node);
  node.children.forEach(validateProbability);
  const unlocked = node.children.filter(child => !child.locked);
  const lockedTotal = node.children.reduce((sum, child) => sum + (child.locked ? child.probability : 0), 0);
  const remaining = (isAbsolute ? node.probability : 100) - lockedTotal;
  const budget = Math.round(remaining);
  if (budget < 0 || Math.abs(budget - remaining) > 1e-8 || (!unlocked.length && budget !== 0)) {
    throw new Error(`Cannot round children of "${node.name}" to whole percentages while preserving locked values.`);
  }

  const weightSum = unlocked.reduce((sum, child) => sum + child.probability, 0);
  const shares = unlocked.map(child => {
    const quota = weightSum ? budget * child.probability / weightSum : budget / unlocked.length;
    const whole = Math.floor(quota);
    return { child, whole, remainder: quota - whole };
  });
  const extra = budget - shares.reduce((sum, share) => sum + share.whole, 0);
  shares.sort((a, b) => b.remainder - a.remainder);
  const rounded = new Map(shares.map(({ child, whole }, index) => [
    child, whole + (index < extra ? 1 : 0)
  ]));

  const children = node.children.map(child => roundTree(
    child.locked ? child : { ...child, probability: rounded.get(child) },
    isAbsolute
  ));
  return { ...node, children };
};

export const toggleAbsolute = (rootNode, isAbsolute) => {
  const toggleAbsoluteRecursive = (node, parentProbability = 100) => {
    let newProbability;
    if (isAbsolute) {
      // Switching TO absolute: convert relative -> absolute
      // Child's relative % (out of 100) scaled by parent's absolute value
      newProbability = node.id === 'root' ? 100 : (node.probability / 100) * parentProbability;
    } else {
      // Switching TO relative: convert absolute -> relative
      // Child's absolute value as a percentage of parent's absolute value
      newProbability = node.id === 'root' ? 100 : (parentProbability > 0 ? (node.probability / parentProbability) * 100 : 0);
    }

    if (node.children) {
      return {
        ...node,
        probability: newProbability,
        // When going TO absolute: pass new absolute value so children can scale
        // When going TO relative: pass old absolute value so children can calculate their %
        children: node.children.map(child => toggleAbsoluteRecursive(child, isAbsolute ? newProbability : node.probability))
      };
    }
    return { ...node, probability: newProbability };
  };

  return toggleAbsoluteRecursive(rootNode);
};
