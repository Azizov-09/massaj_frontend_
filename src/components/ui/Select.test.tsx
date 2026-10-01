import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Select } from './Select';

describe('Custom Select Component', () => {
  const options = [
    { value: 'all', label: 'Barcha usullar' },
    { value: 'cash', label: 'Naqd pul' },
    { value: 'card', label: 'Plastik karta' },
  ];

  it('renders with options and shows the selected label', () => {
    render(<Select options={options} value="card" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Plastik karta');
  });

  it('renders with children <option> tags accurately', () => {
    render(
      <Select value="CASH">
        <option value="">Barcha holatlar</option>
        <option value="CASH">Naqd</option>
        <option value="CARD">Karta</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Naqd');
  });

  it('displays placeholder when value is empty', () => {
    render(
      <Select
        placeholder="Usulni tanlang"
        options={options}
        value=""
      />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Usulni tanlang');
  });

  it('toggles dropdown listbox on trigger click', async () => {
    render(<Select options={options} value="all" />);
    const trigger = screen.getByRole('combobox');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('calls onChange with event.target.value when an option is clicked', () => {
    const handleChange = vi.fn();
    render(<Select options={options} value="all" onChange={handleChange} />);

    fireEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');
    const cardOption = within(listbox).getByText('Plastik karta');
    fireEvent.click(cardOption);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0].target.value).toBe('card');
  });

  it('calls onValueChange callback if provided', () => {
    const handleValueChange = vi.fn();
    render(<Select options={options} value="all" onValueChange={handleValueChange} />);

    fireEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');
    const cashOption = within(listbox).getByText('Naqd pul');
    fireEvent.click(cashOption);

    expect(handleValueChange).toHaveBeenCalledWith('cash');
  });

  it('closes when pressing Escape key', async () => {
    render(<Select options={options} value="all" />);
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('renders label, hint, and error properly', () => {
    render(
      <Select
        label="To'lov turi"
        hint="Iltimos birini tanlang"
        error="Maydon to'ldirilishi shart"
        options={options}
      />
    );
    expect(screen.getByText("To'lov turi")).toBeInTheDocument();
    expect(screen.getByText("Maydon to'ldirilishi shart")).toBeInTheDocument();
  });
});
