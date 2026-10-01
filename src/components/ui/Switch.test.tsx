import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch Component', () => {
  it('renders switch with correct checked state', () => {
    const { rerender } = render(<Switch checked={false} onChange={vi.fn()} aria-label="Test Switch" />);
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-checked', 'false');

    rerender(<Switch checked={true} onChange={vi.fn()} aria-label="Test Switch" />);
    expect(button).toHaveAttribute('aria-checked', 'true');
  });

  it('triggers onChange when clicked', () => {
    const handleChange = vi.fn();
    render(<Switch checked={false} onChange={handleChange} aria-label="Test Switch" />);
    
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('triggers onChange on space and enter key press', () => {
    const handleChange = vi.fn();
    render(<Switch checked={true} onChange={handleChange} aria-label="Test Switch" />);
    const button = screen.getByRole('switch');

    fireEvent.keyDown(button, { key: ' ' });
    expect(handleChange).toHaveBeenCalledWith(false);

    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('renders label and description and toggles on container click', () => {
    const handleChange = vi.fn();
    render(
      <Switch
        checked={false}
        onChange={handleChange}
        label="SMS Eslatmalar"
        description="Seansdan oldin ota-onaga SMS xabarnoma yuborish"
      />
    );

    expect(screen.getByText('SMS Eslatmalar')).toBeInTheDocument();
    expect(screen.getByText('Seansdan oldin ota-onaga SMS xabarnoma yuborish')).toBeInTheDocument();

    fireEvent.click(screen.getByText('SMS Eslatmalar'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('does not trigger onChange when disabled', () => {
    const handleChange = vi.fn();
    render(<Switch checked={false} onChange={handleChange} disabled aria-label="Disabled Switch" />);
    
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).not.toHaveBeenCalled();
  });
});
