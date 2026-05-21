import { describe, it, expect, vi } from 'vitest';
import { logError } from './log-error';

describe('logError', () => {
  it('logs safe error message without sensitive data', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('test', new Error('Something went wrong'));

    expect(spy).toHaveBeenCalledWith('[test] Something went wrong');
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

    logError('session', new Error('Invalid token abc123'));

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
});
