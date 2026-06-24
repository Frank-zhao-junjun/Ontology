import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import EPCStepForm from '../EPCStepForm';

describe('EPCStepForm', () => {
  it('renders event and action inputs', () => {
    render(<EPCStepForm steps={[{event_trigger:'',action:''}]} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('e.g. lead_created')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. score_lead')).toBeInTheDocument();
  });
  it('adds step on click', () => {
    const fn = vi.fn();
    render(<EPCStepForm steps={[{event_trigger:'',action:''}]} onChange={fn} />);
    fireEvent.click(screen.getByText('添加步骤'));
    expect(fn).toHaveBeenCalled();
  });
});
