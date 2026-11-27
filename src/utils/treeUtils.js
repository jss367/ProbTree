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

export const normalizeNode = (rootNode, nodeId, isAbsolute) => {
  // Helper to normalize a node and all its descendants
  const normalizeSubtree = (node) => {
    if (!node.children) return node;

    const target = isAbsolute ? node.probability : 100;

    // Separate locked and unlocked children
    const lockedChildren = node.children.filter(child => child.locked);
    const unlockedChildren = node.children.filter(child => !child.locked);

    // Sum of locked probabilities
    const lockedSum = lockedChildren.reduce((acc, child) => acc + child.probability, 0);

    // Remaining probability for unlocked children
    const remaining = Math.max(0, target - lockedSum);

    // Sum of unlocked probabilities
    const unlockedSum = unlockedChildren.reduce((acc, child) => acc + child.probability, 0);

    const normalizedChildren = node.children.map(child => {
      let newChild;
      if (child.locked) {
        // Keep locked children's probability as-is
        newChild = child;
      } else {
        // Scale unlocked children to fill remaining space
        const newProb = unlockedSum > 0 ? (child.probability / unlockedSum) * remaining : remaining / unlockedChildren.length;
        // Round to avoid floating point precision issues
        newChild = { ...child, probability: Math.round(newProb * 1000000) / 1000000 };
      }
      // Recursively normalize this child's subtree
      return normalizeSubtree(newChild);
    });

    return { ...node, children: normalizedChildren };
  };

  // Find the target node and normalize from there
  const findAndNormalize = (node) => {
    if (node.id === nodeId) {
      return normalizeSubtree(node);
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(findAndNormalize),
      };
    }
    return node;
  };

  return findAndNormalize(rootNode);
};

export const roundNode = (rootNode, nodeId, isAbsolute, decimals = 0) => {
  const multiplier = Math.pow(10, decimals);

  // Round a subtree while preserving sums at each level
  const roundSubtree = (node, targetSum) => {
    if (!node.children || node.children.length === 0) return node;

    const lockedChildren = node.children.filter(c => c.locked);
    const unlockedChildren = node.children.filter(c => !c.locked);

    const lockedSum = lockedChildren.reduce((sum, c) => sum + c.probability, 0);
    const unlockedTarget = targetSum - lockedSum;

    if (unlockedChildren.length === 0) {
      // All locked, just recurse into children
      return {
        ...node,
        children: node.children.map(child =>
          roundSubtree(child, isAbsolute ? child.probability : 100)
        )
      };
    }

    // Round each unlocked child and track rounding errors
    const rounded = unlockedChildren.map(child => {
      const roundedProb = Math.round(child.probability * multiplier) / multiplier;
      return {
        child,
        roundedProb,
        error: child.probability - roundedProb // positive = we rounded down
      };
    });

    // Calculate how much we're off by
    const roundedSum = rounded.reduce((sum, r) => sum + r.roundedProb, 0);
    let diff = Math.round((unlockedTarget - roundedSum) * multiplier) / multiplier;

    // Sort by error to distribute adjustment fairly (largest errors first)
    rounded.sort((a, b) => Math.abs(b.error) - Math.abs(a.error));

    // Distribute the difference
    const step = 1 / multiplier;
    let i = 0;
    while (Math.abs(diff) >= step / 2 && i < rounded.length * 100) {
      const idx = i % rounded.length;
      if (diff > 0) {
        rounded[idx].roundedProb = Math.round((rounded[idx].roundedProb + step) * multiplier) / multiplier;
        diff = Math.round((diff - step) * multiplier) / multiplier;
      } else {
        rounded[idx].roundedProb = Math.round((rounded[idx].roundedProb - step) * multiplier) / multiplier;
        diff = Math.round((diff + step) * multiplier) / multiplier;
      }
      i++;
    }

    // Build the new children array
    const roundedMap = new Map(rounded.map(r => [r.child.id, r.roundedProb]));
    const newChildren = node.children.map(child => {
      const newProb = roundedMap.has(child.id) ? roundedMap.get(child.id) : child.probability;
      const updatedChild = { ...child, probability: newProb };
      // Recurse into this child's subtree
      return roundSubtree(updatedChild, isAbsolute ? newProb : 100);
    });

    return { ...node, children: newChildren };
  };

  // Find the target node and round from there
  const findAndRound = (node) => {
    if (node.id === nodeId) {
      const targetSum = isAbsolute ? node.probability : 100;
      return roundSubtree(node, targetSum);
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(findAndRound),
      };
    }
    return node;
  };

  return findAndRound(rootNode);
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
      newProbability = node.id === 'root' ? 100 : (node.probability / parentProbability) * 100;
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
