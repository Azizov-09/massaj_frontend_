import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateChildForm } from './CreateChildForm';
import { useStore } from '@/store';
import type { AdminUser, Parent } from '@/types';

describe('CreateChildForm Component', () => {
  const mockAdmin: AdminUser = {
    id: 'admin-1',
    fullName: 'Bosh Admin',
    email: 'admin@massaj.uz',
    phone: '+998901234567',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockParents: Parent[] = [
    {
      id: 'par-1',
      fullName: 'Feruza Aliyeva',
      email: 'feruza@example.com',
      phone: '+998901234600',
      role: 'PARENT',
      status: 'ACTIVE',
      childrenIds: [],
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    useStore.setState({
      currentUser: mockAdmin,
      isAuthenticated: true,
      parents: mockParents,
      specialists: [],
      children: [],
    });
  });

  it('keeps submit button disabled until required fields are filled and valid', () => {
    const handleSuccess = vi.fn();
    const handleCancel = vi.fn();

    render(<CreateChildForm onSuccess={handleSuccess} onCancel={handleCancel} />);

    const submitBtn = screen.getByRole('button', { name: /Saqlash/i });
    expect(submitBtn).toBeDisabled();
  });

  it('formats phone number with +998 (XX) XXX-XX-XX mask as user types', async () => {
    render(<CreateChildForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

    const phoneInputs = screen.getAllByPlaceholderText('+998 (90) 123-45-67');
    fireEvent.change(phoneInputs[0], { target: { value: '901234567' } });

    expect(phoneInputs[0]).toHaveValue('+998 (90) 123-45-67');
  });

  it('submits successfully and calls createChild when valid', async () => {
    const handleSuccess = vi.fn();
    const createChildSpy = vi.fn().mockResolvedValue({ id: 'child-1' } as any);
    useStore.setState({ createChild: createChildSpy });

    render(<CreateChildForm onSuccess={handleSuccess} onCancel={vi.fn()} />);

    // Fill Full Name
    const nameInput = screen.getByLabelText(/To'liq ism/i);
    fireEvent.change(nameInput, { target: { value: 'Jasur Karimov' } });

    // Open and select Date of Birth in the past
    const trigger = screen.getByTestId('datepicker-trigger');
    fireEvent.click(trigger);
    const dayBtn = screen.getByRole('button', { name: '5' });
    fireEvent.click(dayBtn);

    // Select Parent via custom Select dropdown
    const parentCombobox = screen.getByRole('combobox', { name: /Ota-ona \/ vasiy/i });
    fireEvent.click(parentCombobox);
    const parentOption = screen.getByRole('option', { name: /Feruza Aliyeva/i });
    fireEvent.click(parentOption);

    // Fill Phone
    const phoneInputs = screen.getAllByPlaceholderText('+998 (90) 123-45-67');
    fireEvent.change(phoneInputs[0], { target: { value: '901234567' } });

    const submitBtn = screen.getByRole('button', { name: /Saqlash/i });
    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createChildSpy).toHaveBeenCalled();
      expect(handleSuccess).toHaveBeenCalled();
    });
  });
});
