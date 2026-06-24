import { describe, it, expect, vi } from 'vitest';
import { logError } from './log-error';

describe('logError', () => {
  it('logs safe error message without sensitive data', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('test', new Error('Something went wrong'));

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[test] Something went wrong\nError: Something went wrong'));
    spy.mockRestore();
  });

  it('sanitizes errors containing password in message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('auth', new Error('Failed to validate password hash'));

    expect(spy).toHaveBeenCalledWith('[auth] Sensitive error occurred');
    spy.mockRestore();
  });

  it('sanitizes errors containing token in message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('session', new Error('Invalid session-token abc123'));

    expect(spy).toHaveBeenCalledWith('[session] Sensitive error occurred');
    spy.mockRestore();
  });

  it('sanitizes errors containing secret in message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('2fa', new Error('TOTP secret generation failed'));

    expect(spy).toHaveBeenCalledWith('[2fa] Sensitive error occurred');
    spy.mockRestore();
  });

  it('handles string errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('test', 'Plain error message');

    expect(spy).toHaveBeenCalledWith('[test] Plain error message');
    spy.mockRestore();
  });

  it('handles non-error objects', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('test', { code: 'ECONNREFUSED', message: 'Connection refused' });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[test]'));
    spy.mockRestore();
  });

  it('sanitizes object errors with sensitive keys', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('test', { password: 'secret123', code: 'ERR' });

    expect(spy).toHaveBeenCalledWith('[test] Sensitive error occurred');
    spy.mockRestore();
  });

  it('allows generic key errors (not sensitive)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('db', new Error('key not found in database'));
    logError('ui', new Error('Keyboard event error'));
    logError('db', new Error('Primary key constraint violation'));

    expect(spy).toHaveBeenNthCalledWith(1, expect.stringContaining('[db] key not found in database'));
    expect(spy).toHaveBeenNthCalledWith(2, expect.stringContaining('[ui] Keyboard event error'));
    expect(spy).toHaveBeenNthCalledWith(3, expect.stringContaining('[db] Primary key constraint violation'));
    spy.mockRestore();
  });

  it('sanitizes specific key types that are sensitive', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('auth', new Error('api_key exposed in response'));
    logError('auth', new Error('private_key file missing'));
    logError('auth', new Error('access_key expired'));
    logError('auth', new Error('signing-key invalid'));

    // All should be sanitized as sensitive
    for (let i = 1; i <= 4; i++) {
      expect(spy).toHaveBeenNthCalledWith(i, '[auth] Sensitive error occurred');
    }
    spy.mockRestore();
  });
});
