import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailVerificationForm } from '../EmailVerificationForm';

describe('EmailVerificationForm', () => {
  const mockProps = {
    email: 'test@example.com',
    onVerify: jest.fn().mockResolvedValue(undefined),
    onResendCode: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct email display', () => {
    render(<EmailVerificationForm {...mockProps} />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Check your email')).toBeInTheDocument();
  });

  it('renders input field with correct placeholder', () => {
    render(<EmailVerificationForm {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter 6-digit code');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('maxLength', '6');
  });

  it('disables verify button when input is empty', () => {
    render(<EmailVerificationForm {...mockProps} />);

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    expect(verifyButton).toBeDisabled();
  });

  it('enables verify button when code is entered', () => {
    render(<EmailVerificationForm {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter 6-digit code');
    fireEvent.change(input, { target: { value: '123456' } });

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    expect(verifyButton).not.toBeDisabled();
  });

  it('calls onVerify with trimmed code on submit', async () => {
    render(<EmailVerificationForm {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter 6-digit code');
    const verifyButton = screen.getByRole('button', { name: /verify/i });

    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockProps.onVerify).toHaveBeenCalledWith('123456');
    });
  });

  it('displays error message when verification fails', async () => {
    const failingProps = {
      ...mockProps,
      onVerify: jest.fn().mockRejectedValue(new Error('Invalid code')),
    };

    render(<EmailVerificationForm {...failingProps} />);

    const input = screen.getByPlaceholderText('Enter 6-digit code');
    const verifyButton = screen.getByRole('button', { name: /verify/i });

    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid code')).toBeInTheDocument();
    });
  });

  it('calls onResendCode when resend button is clicked', async () => {
    render(<EmailVerificationForm {...mockProps} />);

    const resendButton = screen.getByRole('button', { name: /resend code/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(mockProps.onResendCode).toHaveBeenCalled();
    });
  });

  it('shows error when submitting empty code', async () => {
    render(<EmailVerificationForm {...mockProps} />);

    const form = screen.getByRole('button', { name: /verify/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please enter the verification code')).toBeInTheDocument();
    });
    expect(mockProps.onVerify).not.toHaveBeenCalled();
  });
});
