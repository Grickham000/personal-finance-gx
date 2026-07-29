import { useState } from 'react';
import { apiService } from '../services/api';
import { extractErrorMessage } from '../utils/errors';

export const useRegister = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // POST request to backend API to handle auth creation + custom token + email verification
      await apiService.registerUser(email.trim(), password);
      setRegistered(true);
    } catch (err: any) {
      console.error(err);
      const errMsg = extractErrorMessage(err);
      if (errMsg.includes('EMAIL_EXISTS')) {
        setError('This email address is already registered.');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    setError,
    loading,
    registered,
    setRegistered,
    handleRegister,
  };
};
