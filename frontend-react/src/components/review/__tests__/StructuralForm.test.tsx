import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import StructuralForm from '../StructuralForm';

const defaults = { entityName: '', domain: '', domainId: null as number | null, subDomain: '', scenario: '', attributes: [], relations: [], inheritance: '', valueObjects: [] };

describe('StructuralForm', () => {
  it('renders entity name input', () => {
    render(<StructuralForm data={defaults} onChange={vi.fn()} />);
    const inputs = screen.getAllByDisplayValue('');
    expect(inputs.length).toBeGreaterThanOrEqual(3);
    expect(inputs[0]).toBeInTheDocument();
  });
});
