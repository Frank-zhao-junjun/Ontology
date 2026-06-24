import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ThreeColumnLayout from '../ThreeColumnLayout';

describe('ThreeColumnLayout', () => {
  it('renders 3 panels', () => {
    render(<ThreeColumnLayout />);
    expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('center-panel')).toBeInTheDocument();
    expect(screen.getByTestId('right-sidebar')).toBeInTheDocument();
  });

  it('has toggle buttons', () => {
    render(<ThreeColumnLayout />);
    expect(screen.getByTestId('toggle-left')).toBeInTheDocument();
  });
});
