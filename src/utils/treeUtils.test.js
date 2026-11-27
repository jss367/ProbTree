import { roundTree } from './treeUtils';

const branch = (...probabilities) => ({
  name: 'Root', probability: 100, children: probabilities.map(probability => ({ probability }))
});
const values = node => node.children.map(child => child.probability);

test('rounds to the closest allocation without subtracting from a zero share', () => {
  expect(values(roundTree(branch(0.49, 24.6, 24.6, 24.6, 25.71), true)))
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
