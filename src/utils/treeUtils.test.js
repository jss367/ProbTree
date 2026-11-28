import sample from './__fixtures__/dark-matter.json';
import { normalizeNode, roundNode, roundTree, toggleAbsolute } from './treeUtils';

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

test.each([-10, 101, Infinity, NaN, '20', null])('rejects invalid probability %p before allocating shares', value => {
  const root = tree([value, 20]);
  expect(() => roundNode(root, 'root', true)).toThrow(/between 0 and 100/);
  expect(() => normalizeNode(root, 'root', false)).toThrow(/between 0 and 100/);
  expect(probabilities(root)).toEqual([value, 20]);
});

test.each([-10, null])('rejects an invalid selected probability %p without changing descendants', value => {
  const selected = { ...tree([5, 15]), id: 'selected', probability: value };
  const root = { ...tree([]), children: [selected] };
  expect(() => roundNode(selected, selected.id, true)).toThrow(/between 0 and 100/);
  expect(() => normalizeNode(root, selected.id, true)).toThrow(/between 0 and 100/);
  expect(probabilities(selected)).toEqual([5, 15]);
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

const branch = (...probabilities) => ({
  name: 'Root', probability: 100, children: probabilities.map(probability => ({ probability }))
});
const values = node => node.children.map(child => child.probability);

test('rounds to the closest allocation without subtracting from a zero share', () => {
  expect(values(roundTree(branch(0.49, 24.6, 24.6, 24.6, 25.71), true)))
    .toEqual([0, 25, 25, 24, 26]);
  expect(values(roundNode({ ...branch(0.49, 24.6, 24.6, 24.6, 25.71), id: 'root' }, 'root', true)))
    .toEqual([0, 25, 25, 24, 26]);
});

test.each([[true, [14, 13, 13]], [false, [34, 33, 33]]])(
  'uses the correct target for descendants in absolute mode %s', (absolute, expected) => {
    const root = branch(40, 60);
    root.children[0] = { ...branch(0, 0, 0), probability: 40, locked: true };
    const result = roundTree(root, absolute);
    expect(values(result)).toEqual([40, 60]);
    expect(values(result.children[0])).toEqual(expected);
  }
);

test('reserves the locked amount before allocating the balance', () => {
  const root = branch(17, 1, 3);
  root.children[0].locked = true;
  expect(values(roundTree(root, true))).toEqual([17, 21, 62]);
});

test.each([branch(13.5, 86.5), branch(60, 60)])('leaves the input intact when locks prevent rounding', root => {
  root.children[0].locked = true;
  root.children[1].locked = true;
  // Leave an integer sibling available when the locked amount is fractional.
  if (root.children[0].probability === 13.5) root.children[1].locked = false;
  const original = JSON.stringify(root);
  expect(() => roundTree(root, true)).toThrow(/locked values/);
  expect(JSON.stringify(root)).toBe(original);
});
