import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DatePicker } from './DatePicker';

describe('Custom DatePicker Component', () => {
  it('renders with value and displays formatted date (dd.MM.yyyy)', () => {
    render(<DatePicker value="2027-06-23" />);
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('23.06.2027');
  });

  it('renders placeholder when value is empty', () => {
    render(<DatePicker value="" placeholder="Sana tanlang..." />);
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('Sana tanlang...');
  });

  it('toggles calendar dialog on button click', async () => {
    render(<DatePicker value="2026-10-01" />);
    const trigger = screen.getByTestId('datepicker-trigger');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('calls onChange and onValueChange when a day is selected', () => {
    const handleChange = vi.fn();
    const handleValueChange = vi.fn();
    render(
      <DatePicker
        value="2026-10-01"
        onChange={handleChange}
        onValueChange={handleValueChange}
      />
    );

    fireEvent.click(screen.getByTestId('datepicker-trigger'));
    const day15 = screen.getByRole('button', { name: '15' });
    fireEvent.click(day15);

    expect(handleValueChange).toHaveBeenCalledWith('2026-10-15');
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls[0][0].target.value).toBe('2026-10-15');
  });

  it('clears date when clear button is clicked', () => {
    const handleChange = vi.fn();
    render(<DatePicker value="2026-10-01" onChange={handleChange} clearable />);

    const clearBtn = screen.getByTestId('datepicker-clear');
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls[0][0].target.value).toBe('');
  });

  it('closes calendar on Escape key', async () => {
    render(<DatePicker value="2026-10-01" />);
    fireEvent.click(screen.getByTestId('datepicker-trigger'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('integrates seamlessly with react-hook-form Controller', async () => {
    const { useForm, Controller } = await import('react-hook-form');
    const TestComponent = ({ onSubmit }: { onSubmit: (data: { testDate: string }) => void }) => {
      const { control, handleSubmit } = useForm({
        defaultValues: { testDate: '2026-10-01' },
      });
      return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            control={control}
            name="testDate"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <button type="submit">Saqlash</button>
        </form>
      );
    };

    const handleSubmit = vi.fn();
    render(<TestComponent onSubmit={handleSubmit} />);

    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('01.10.2026');

    // Click trigger and pick 20
    fireEvent.click(screen.getByTestId('datepicker-trigger'));
    const day20 = screen.getByRole('button', { name: '20' });
    fireEvent.click(day20);

    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('20.10.2026');

    fireEvent.click(screen.getByText('Saqlash'));
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        { testDate: '2026-10-20' },
        expect.anything()
      );
    });
  });

  it('allows picking a month via custom animated month dropdown', async () => {
    render(<DatePicker value="2026-10-01" />);
    fireEvent.click(screen.getByTestId('datepicker-trigger'));

    const monthTrigger = screen.getByTestId('datepicker-month-trigger');
    expect(monthTrigger).toHaveTextContent('Oktabr');
    expect(screen.queryByRole('listbox', { name: "Oylar ro'yxati" })).not.toBeInTheDocument();

    // Open month picker
    fireEvent.click(monthTrigger);
    expect(screen.getByRole('listbox', { name: "Oylar ro'yxati" })).toBeInTheDocument();

    // Select Aprel
    const aprelOption = screen.getByRole('option', { name: 'Aprel' });
    fireEvent.click(aprelOption);

    // Month picker closes and header reflects Aprel
    await waitFor(() => {
      expect(screen.queryByRole('listbox', { name: "Oylar ro'yxati" })).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('datepicker-month-trigger')).toHaveTextContent('Aprel');
  });

  it('allows picking a year via custom animated year dropdown', async () => {
    render(<DatePicker value="2026-10-01" />);
    fireEvent.click(screen.getByTestId('datepicker-trigger'));

    const yearTrigger = screen.getByTestId('datepicker-year-trigger');
    expect(yearTrigger).toHaveTextContent('2026');
    expect(screen.queryByRole('listbox', { name: "Yillar ro'yxati" })).not.toBeInTheDocument();

    // Open year picker
    fireEvent.click(yearTrigger);
    expect(screen.getByRole('listbox', { name: "Yillar ro'yxati" })).toBeInTheDocument();

    // Select 2024
    const y2024Option = screen.getByRole('option', { name: '2024' });
    fireEvent.click(y2024Option);

    // Year picker closes and header reflects 2024
    await waitFor(() => {
      expect(screen.queryByRole('listbox', { name: "Yillar ro'yxati" })).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('datepicker-year-trigger')).toHaveTextContent('2024');
  });

  it('closes sub-picker on Escape without closing main calendar', async () => {
    render(<DatePicker value="2026-10-01" />);
    fireEvent.click(screen.getByTestId('datepicker-trigger'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Open month picker
    fireEvent.click(screen.getByTestId('datepicker-month-trigger'));
    expect(screen.getByRole('listbox', { name: "Oylar ro'yxati" })).toBeInTheDocument();

    // Press Escape -> closes month picker, but dialog stays open
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('listbox', { name: "Oylar ro'yxati" })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape again -> closes main calendar dialog
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});



