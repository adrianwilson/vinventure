import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailVerificationForm } from '../EmailVerificationForm';

// Mock the useAuth hook
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    confirmEmail: jest.fn(),
    signUp: jest.fn(),
  }),
}));

describe('EmailVerificationForm', () => {
  const mockProps = {
    email: 'test@example.com',
    onVerify: jest.fn().mockResolvedValue(undefined),
    onVerificationSuccess: jest.fn(),
    onResendCode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct email display', () => {
    render(<EmailVerificationForm {...mockProps} />);
    
    expect(screen.getByText(/verification code sent to/i)).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders 6-digit input field', () => {
    render(<EmailVerificationForm {...mockProps} />);
    
    const input = screen.getByPlaceholderText('000000');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('maxLength', '6');
  });

  it('enables verify button when 6 digits are entered', async () => {
    render(<EmailVerificationForm {...mockProps} />);
    
    const input = screen.getByPlaceholderText('000000');
    const verifyButton = screen.getByRole('button', { name: /verify/i });
    
    expect(verifyButton).toBeDisabled();
    
    fireEvent.change(input, { target: { value: '123456' } });
    
    await waitFor(() => {
      expect(verifyButton).toBeEnabled();
    });
  });

  it('calls onVerificationSuccess when verification succeeds', async () => {
    const { useAuth } = require('../../../contexts/AuthContext');
    const mockConfirmEmail = jest.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({
      confirmEmail: mockConfirmEmail,
      signUp: jest.fn(),
    });

    render(<EmailVerificationForm {...mockProps} />);
    
    const input = screen.getByPlaceholderText('000000');
    const verifyButton = screen.getByRole('button', { name: /verify/i });
    
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(mockConfirmEmail).toHaveBeenCalledWith('test@example.com', '123456');
      expect(mockProps.onVerificationSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message when verification fails', async () => {
    const { useAuth } = require('../../../contexts/AuthContext');
    const mockConfirmEmail = jest.fn().mockRejectedValue(new Error('Invalid code'));
    useAuth.mockReturnValue({
      confirmEmail: mockConfirmEmail,
      signUp: jest.fn(),
    });

    render(<EmailVerificationForm {...mockProps} />);
    
    const input = screen.getByPlaceholderText('000000');
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

  it('disables buttons while loading', async () => {
    const { useAuth } = require('../../../contexts/AuthContext');
    const mockConfirmEmail = jest.fn().mockImplementation(() => new Promise(() => { /* intentionally unresolved */ }));
    useAuth.mockReturnValue({
      confirmEmail: mockConfirmEmail,
      signUp: jest.fn(),
    });

    render(<EmailVerificationForm {...mockProps} />);
    
    const input = screen.getByPlaceholderText('000000');
    const verifyButton = screen.getByRole('button', { name: /verify/i });
    const resendButton = screen.getByRole('button', { name: /resend code/i });
    
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(verifyButton).toBeDisabled();
      expect(resendButton).toBeDisabled();
    });
  });

  it('only allows numeric input', () => {
    render(<EmailVerificationForm {...mockProps} />);
    
    const input = screen.getByPlaceholderText('000000') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: 'abc123' } });
    expect(input.value).toBe('123');
    
    fireEvent.change(input, { target: { value: '!@#456' } });
    expect(input.value).toBe('456');
  });

  it('limits input to 6 characters', () => {
    render(<EmailVerificationForm {...mockProps} />);
    
    const input = screen.getByPlaceholderText('000000') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: '1234567890' } });
    expect(input.value).toBe('123456');
  });
});