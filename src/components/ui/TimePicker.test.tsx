import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimePicker } from './TimePicker';

describe('TimePicker Component', () => {
  it('renders with placeholder and value', () => {
    const { rerender } = render(<TimePicker placeholder="Vaqtni tanlang..." value="" onChange={vi.fn()} />);
    expect(screen.getByText('Vaqtni tanlang...')).toBeInTheDocument();

    rerender(<TimePicker value="14:30" onChange={vi.fn()} />);
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('renders label and error message', () => {
    render(
      <TimePicker
        label="Boshlanish vaqti"
        error="Noto'g'ri vaqt"
        value="09:00"
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText('Boshlanish vaqti')).toBeInTheDocument();
    expect(screen.getByText("Noto'g'ri vaqt")).toBeInTheDocument();
  });

  it('opens popup when trigger button is clicked', () => {
    render(<TimePicker value="09:00" onChange={vi.fn()} />);
    expect(screen.queryByText('Mashhur vaqtlar:')).not.toBeInTheDocument();

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByText('Mashhur vaqtlar:')).toBeInTheDocument();
  });

  it('selects preset time and calls onChange', () => {
    const handleChange = vi.fn();
    render(<TimePicker value="09:00" onChange={handleChange} />);

    fireEvent.click(screen.getByRole('button'));
    const presetBtn = screen.getByRole('button', { name: 'Vaqt 10:00' });
    fireEvent.click(presetBtn);

    expect(handleChange).toHaveBeenCalled();
    const event = handleChange.mock.calls[0][0];
    expect(event.target.value).toBe('10:00');
  });

  it('applies custom hour and minute selection', () => {
    const handleChange = vi.fn();
    render(<TimePicker value="09:00" onChange={handleChange} />);

    fireEvent.click(screen.getByRole('button'));
    
    // Choose hour 15
    const hourBtn = screen.getByRole('button', { name: 'Soat 15' });
    fireEvent.click(hourBtn);

    // Choose minute 30 daqiqa
    const minuteBtn = screen.getByRole('button', { name: '30 daqiqa' });
    fireEvent.click(minuteBtn);

    // Click Tanlash
    const applyBtn = screen.getByRole('button', { name: 'Tanlash' });
    fireEvent.click(applyBtn);

    expect(handleChange).toHaveBeenCalled();
    const event = handleChange.mock.calls[0][0];
    expect(event.target.value).toBe('15:30');
  });

  it('clears value when clearable is enabled', async () => {
    const handleChange = vi.fn();
    render(<TimePicker value="09:00" onChange={handleChange} clearable />);

    const clearBtn = screen.getByTitle('Tozalash');
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalled();
    const event = handleChange.mock.calls[0][0];
    expect(event.target.value).toBe('');
  });
});
