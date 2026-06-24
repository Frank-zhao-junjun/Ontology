import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ChatInput from '../ChatInput';

describe('ChatInput', () => {
  it('calls onSend', () => {
    const fn = vi.fn();
    render(<ChatInput onSend={fn} />);
    fireEvent.change(screen.getByPlaceholderText('输入消息...'), { target: { value: 'hi' } });
    fireEvent.click(screen.getByText('发送'));
    expect(fn).toHaveBeenCalledWith('hi');
  });
});
