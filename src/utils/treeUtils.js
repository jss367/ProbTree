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
        name: 'New cause',
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
  const normalizeNodeRecursive = (node) => {
    if (node.id === nodeId && node.children) {
      const sum = node.children.reduce((acc, child) => acc + child.probability, 0);
      const normalizedChildren = node.children.map(child => ({
        ...child,
        probability: isAbsolute ? (child.probability / sum) * node.probability : (child.probability / sum) * 100
      }));
      return { ...node, children: normalizedChildren };
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(normalizeNodeRecursive),
      };
    }
    return node;
  };

  return normalizeNodeRecursive(rootNode);
};

export const toggleAbsolute = (rootNode, isAbsolute) => {
  const toggleAbsoluteRecursive = (node, parentProbability = 100) => {
    let newProbability;
    if (isAbsolute) {
      newProbability = node.id === 'root' ? 100 : (node.probability / parentProbability) * 100;
    } else {
      newProbability = node.id === 'root' ? 100 : (node.probability / 100) * parentProbability;
    }

    if (node.children) {
      return {
        ...node,
        probability: newProbability,
        children: node.children.map(child => toggleAbsoluteRecursive(child, isAbsolute ? node.probability : newProbability))
      };
    }
    return { ...node, probability: newProbability };
  };

  return toggleAbsoluteRecursive(rootNode);
};
