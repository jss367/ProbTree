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
        newChild = { ...child, probability: newProb };
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
