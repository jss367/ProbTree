import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

jest.mock('./hooks/useFirebase', () => () => ({ user: null }));

test('rounds edited probabilities using the editor button', () => {
  render(<App />);
  const inputFor = name => within(screen.getByDisplayValue(name).closest('.node-row')).getByRole('spinbutton');
  const edited = inputFor('Detecting something real');
  fireEvent.change(edited, { target: { value: '50.1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Round' }));
  expect(edited).toHaveValue(50.1);
  expect(inputFor('Normal cat behavior')).toHaveValue(39);
});

test('deletes a belief from its node actions', () => {
  render(<App />);
  const name = 'Normal cat behavior';
  const row = within(screen.getByDisplayValue(name).closest('.node-row'));
  fireEvent.click(row.getByRole('button', { name: 'More node actions' }));
  fireEvent.click(row.getByRole('button', { name: 'Delete' }));
  expect(screen.queryByDisplayValue(name)).toBeNull();
});
