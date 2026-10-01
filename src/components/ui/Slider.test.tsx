import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Slider } from './Slider';

describe('Slider component', () => {
  it('renders label and current value badge', () => {
    const handleChange = vi.fn();
    render(<Slider label="Progress" value={50} onChange={handleChange} />);

    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Faol jarayon/i)).toBeInTheDocument();
  });

  it('changes value when range input is moved', () => {
    const handleChange = vi.fn();
    render(<Slider label="Progress" value={20} onChange={handleChange} />);

    const input = screen.getByRole('slider');
    fireEvent.change(input, { target: { value: '75' } });

    expect(handleChange).toHaveBeenCalledWith(75);
  });

  it('selects preset when preset button is clicked', () => {
    const handleChange = vi.fn();
    render(<Slider label="Progress" value={0} onChange={handleChange} presets={[0, 25, 50, 75, 100]} />);

    const preset75 = screen.getByRole('button', { name: '75%' });
    fireEvent.click(preset75);

    expect(handleChange).toHaveBeenCalledWith(75);
  });

  it('adjusts value via steppers', () => {
    const handleChange = vi.fn();
    render(<Slider label="Progress" value={30} step={5} onChange={handleChange} />);

    const minusBtn = screen.getByRole('button', { name: '5% kamaytirish' });
    const plusBtn = screen.getByRole('button', { name: '5% oshirish' });

    fireEvent.click(minusBtn);
    expect(handleChange).toHaveBeenCalledWith(25);

    fireEvent.click(plusBtn);
    expect(handleChange).toHaveBeenCalledWith(35);
  });

  it('displays completion theme when value is 100', () => {
    const handleChange = vi.fn();
    render(<Slider label="Progress" value={100} onChange={handleChange} />);

    expect(screen.getAllByText('100%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/To‘liq bajarildi/i)).toBeInTheDocument();
  });
});
