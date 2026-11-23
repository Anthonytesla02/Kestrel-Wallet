import test from 'node:test';
import assert from 'node:assert/strict';
import { BiometricAuthError } from '@capgo/capacitor-native-biometric';
import {
  getBiometricActionLabel,
  getBiometricStatusCopy,
  mapNativeBiometricError,
  shouldStartLocked,
} from './biometricLogic';

test('shouldStartLocked defaults to true and respects autostart=1', () => {
  assert.equal(shouldStartLocked(''), true);
  assert.equal(shouldStartLocked('?foo=bar'), true);
  assert.equal(shouldStartLocked('?autostart=1'), false);
});

test('getBiometricActionLabel returns clear labels across methods, phases, and native Android', () => {
  assert.equal(getBiometricActionLabel('fingerprint', 'idle'), 'Scan Fingerprint');
  assert.equal(
    getBiometricActionLabel('fingerprint', 'idle', true),
    'Unlock with Device Fingerprint'
  );
  assert.equal(getBiometricActionLabel('fingerprint', 'scanning'), 'Scanning Fingerprint…');
  assert.equal(getBiometricActionLabel('fingerprint', 'verified'), 'Unlocked');
  assert.equal(getBiometricActionLabel('face', 'idle'), 'Scan Face');
  assert.equal(getBiometricActionLabel('face', 'error'), 'Retry Face Scan');
});

test('getBiometricStatusCopy returns descriptive status text', () => {
  assert.match(getBiometricStatusCopy('fingerprint', 'idle'), /fingerprint/i);
  assert.match(getBiometricStatusCopy('fingerprint', 'idle', true), /android fingerprint/i);
  assert.match(getBiometricStatusCopy('fingerprint', 'scanning'), /ridge/i);
  assert.match(getBiometricStatusCopy('face', 'scanning'), /facial/i);
  assert.match(getBiometricStatusCopy('face', 'verified'), /verified/i);
});

test('mapNativeBiometricError produces actionable Android error messages', () => {
  assert.match(
    mapNativeBiometricError(BiometricAuthError.BIOMETRICS_NOT_ENROLLED),
    /android settings/i
  );
  assert.match(
    mapNativeBiometricError(BiometricAuthError.USER_CANCEL),
    /cancelled/i
  );
  assert.match(
    mapNativeBiometricError(BiometricAuthError.AUTHENTICATION_FAILED),
    /did not match/i
  );
});
