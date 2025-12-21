import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders LifeFlow app', () => {
  render(<App />);
  const heading = screen.getByText(/LifeFlow/i);
  expect(heading).toBeInTheDocument();
});
