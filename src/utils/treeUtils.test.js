import sample from './__fixtures__/dark-matter.json';
import { normalizeNode, roundNode, toggleAbsolute } from './treeUtils';

const probabilities = node => node.children.map(child => child.probability);
const tree = values => ({
  id: 'root', probability: 100,
  children: values.map((probability, id) => ({ id, probability }))
});

test('rounds the revised sample recursively and preserves locks and sibling order', () => {
  const rounded = roundNode(sample.data, 'root', true);
  const check = (node, original) => {
    expect(node.id).toBe(original.id);
    if (original.locked) expect(node.probability).toBe(original.probability);
    if (!node.children?.length) return;
    expect(probabilities(node).reduce((a, b) => a + b, 0)).toBeCloseTo(node.probability, 10);
    node.children.forEach((child, i) => check(child, original.children[i]));
  };
  check(rounded, sample.data);
  expect(roundNode(rounded, 'root', true)).toEqual(rounded);
});

test('normalizes zero weights and breaks ties in sibling order', () => {
  expect(probabilities(roundNode(tree([0, 0, 0]), 'root', false))).toEqual([34, 33, 33]);
  expect(probabilities(normalizeNode(tree([0, 0, 0]), 'root', false))).toEqual([33.333334, 33.333333, 33.333333]);
});

test('preserves impossible locks and keeps unlocked values nonnegative', () => {
  const root = tree([60, 55, 2]);
  root.children[0].locked = root.children[1].locked = true;
  expect(probabilities(roundNode(root, 'root', true))).toEqual([60, 55, 0]);
});

test('relative subtrees total 100 even under a smaller parent', () => {
  const root = tree([20, 80]);
  root.children[0].children = tree([1, 2]).children;
  const rounded = roundNode(root, 0, false);
  expect(probabilities(rounded.children[0])).toEqual([33, 67]);
  expect(probabilities(rounded)).toEqual([20, 80]);
});

test('converting a rounded zero branch to relative mode yields finite values', () => {
  const root = tree([0, 100]);
  root.children[0].children = tree([0]).children;
  expect(probabilities(toggleAbsolute(root, false).children[0])).toEqual([0]);
});
