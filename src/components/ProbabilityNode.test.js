import { fireEvent, render, screen } from '@testing-library/react';
import ProbabilityNode from './ProbabilityNode';

test('an empty root has no actions menu', () => {
  render(<ProbabilityNode node={{ id: 'root', name: 'Root', probability: 100 }} />);
  expect(screen.queryByRole('button', { name: 'Node actions' })).toBeNull();
});

test('a leaf menu can delete the selected node', () => {
  const onRemove = jest.fn();
  render(<ProbabilityNode node={{ id: 'leaf', name: 'Leaf', probability: 50 }} onRemove={onRemove} />);
  fireEvent.click(screen.getByRole('button', { name: 'Node actions' }));
  expect(screen.queryByText('Normalize children')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(onRemove).toHaveBeenCalledWith('leaf');
  expect(screen.queryByText('Delete')).toBeNull();
});
