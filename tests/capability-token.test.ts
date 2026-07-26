import { describe, it, expect } from 'vitest';
import {
  generateGuestTrackingToken,
  hashGuestTrackingToken,
  verifyGuestTrackingToken
} from '../src/lib/capability-token';

describe('Capability Token Primitives', () => {
  it('generated token is non-empty', () => {
    const token = generateGuestTrackingToken();
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('generated token uses expected base64url-safe representation', () => {
    const token = generateGuestTrackingToken();
    // base64url characters: alphanumeric, -, _
    expect(token).toMatch(/^[A-Za-z0-9\-_]+$/);
    // 32 bytes in base64 is ~43 chars
    expect(token.length).toBe(43);
  });

  it('independent generations produce different tokens', () => {
    const token1 = generateGuestTrackingToken();
    const token2 = generateGuestTrackingToken();
    expect(token1).not.toBe(token2);
  });

  it('raw token is not equal to stored hash', () => {
    const token = generateGuestTrackingToken();
    const hash = hashGuestTrackingToken(token);
    expect(token).not.toBe(hash);
  });

  it('hash output is deterministic', () => {
    const token = generateGuestTrackingToken();
    const hash1 = hashGuestTrackingToken(token);
    const hash2 = hashGuestTrackingToken(token);
    expect(hash1).toBe(hash2);
  });

  it('hash output is 64-character SHA-256 hex', () => {
    const token = generateGuestTrackingToken();
    const hash = hashGuestTrackingToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash.length).toBe(64);
  });

  it('correct token verifies true', () => {
    const token = generateGuestTrackingToken();
    const hash = hashGuestTrackingToken(token);
    expect(verifyGuestTrackingToken(token, hash)).toBe(true);
  });

  it('incorrect token verifies false', () => {
    const token1 = generateGuestTrackingToken();
    const token2 = generateGuestTrackingToken();
    const hash1 = hashGuestTrackingToken(token1);
    expect(verifyGuestTrackingToken(token2, hash1)).toBe(false);
  });

  it('malformed stored hash safely returns false', () => {
    const token = generateGuestTrackingToken();
    expect(verifyGuestTrackingToken(token, 'short_hash')).toBe(false);
    expect(verifyGuestTrackingToken(token, 'invalid_hex_invalid_hex_invalid_hex_invalid_hex_invalid_hex_in')).toBe(false); // 64 chars but not hex
  });

  it('empty/invalid candidate handling is safe', () => {
    const token = generateGuestTrackingToken();
    const hash = hashGuestTrackingToken(token);
    expect(verifyGuestTrackingToken('', hash)).toBe(false);
    expect(verifyGuestTrackingToken(undefined, hash)).toBe(false);
    expect(verifyGuestTrackingToken(null, hash)).toBe(false);
    expect(verifyGuestTrackingToken(token, '')).toBe(false);
    expect(verifyGuestTrackingToken(token, undefined)).toBe(false);
    expect(verifyGuestTrackingToken(token, null)).toBe(false);
  });
});
