import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mocking Map component from 'react-map-gl'
jest.mock('react-map-gl', () => ({
  Map: () => <div data-testid="mock-map"></div>
}));

test('renders map container', () => {
  render(<App />);
  const mapContainer = screen.getByTestId('mock-map');
  expect(mapContainer).toBeInTheDocument();
});
