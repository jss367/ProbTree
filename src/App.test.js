import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./hooks/useFirebase', () => () => ({ user: null }));
jest.mock('./samples/cat-staring-at-wall.json', () => ({
  isAbsolute: true,
  data: {
    id: 'root', name: 'Forecast', probability: 100,
    children: [
      { id: 'a', name: 'First outcome', probability: 75.7 },
      { id: 'b', name: 'Second outcome', probability: 24.3 }
    ]
  }
}));

test('rounds the probabilities displayed in the editor', () => {
  render(<App />);
  const percentages = () => screen.getAllByRole('spinbutton').map(input => input.valueAsNumber);
  expect(percentages()).toEqual([75.7, 24.3]);
  fireEvent.click(screen.getByRole('button', { name: 'Round' }));
  expect(percentages()).toEqual([76, 24]);
});
