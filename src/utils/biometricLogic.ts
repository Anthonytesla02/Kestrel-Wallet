import { Capacitor } from '@capacitor/core';
import {
  BiometricAuthError,
  BiometryType,
  NativeBiometric,
  type AvailableResult,
} from '@capgo/capacitor-native-biometric';

export type BiometricMethod = 'fingerprint' | 'face';
export type BiometricPhase = 'idle' | 'scanning' | 'verified' | 'error';

export function shouldStartLocked(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get('autostart') !== '1';
}

export function getBiometricActionLabel(
  method: BiometricMethod,
  phase: BiometricPhase,
  isNativeAndroid = false
): string {
  if (phase === 'scanning') {
    return method === 'fingerprint' ? 'Scanning Fingerprint…' : 'Scanning Face…';
  }
  if (phase === 'verified') {
    return 'Unlocked';
  }
  if (phase === 'error') {
    return method === 'fingerprint' ? 'Retry Fingerprint' : 'Retry Face Scan';
  }
  if (isNativeAndroid) {
    return method === 'fingerprint' ? 'Unlock with Device Fingerprint' : 'Unlock with Device Biometrics';
  }
  return method === 'fingerprint' ? 'Scan Fingerprint' : 'Scan Face';
}

export function getBiometricStatusCopy(
  method: BiometricMethod,
  phase: BiometricPhase,
  isNativeAndroid = false
): string {
  switch (phase) {
    case 'idle':
      if (isNativeAndroid) {
        return method === 'fingerprint'
          ? 'Press below to prompt your Android fingerprint sensor and log into your wallet.'
          : 'Press below to verify with your device biometrics and log into your wallet.';
      }
      return method === 'fingerprint'
        ? 'Press the button below to verify your fingerprint and reveal your wallet.'
        : 'Press the button below to run facial recognition and reveal your wallet.';
    case 'scanning':
      return method === 'fingerprint'
        ? 'Analyzing dermal ridge pattern…'
        : 'Mapping facial depth landmarks…';
    case 'verified':
      return 'Identity verified. Unlocking Kestrel Wallet…';
    case 'error':
      return 'Verification could not complete. Please try again.';
  }
}

export function mapNativeBiometricError(code?: number, fallbackMessage?: string): string {
  switch (code) {
    case BiometricAuthError.BIOMETRICS_NOT_ENROLLED:
      return 'No fingerprint or biometric is enrolled on this device. Add one in Android Settings > Security.';
    case BiometricAuthError.BIOMETRICS_UNAVAILABLE:
      return 'Biometric hardware is unavailable on this device.';
    case BiometricAuthError.USER_LOCKOUT:
    case BiometricAuthError.USER_TEMPORARY_LOCKOUT:
      return 'Too many failed attempts. Biometrics temporarily locked by Android.';
    case BiometricAuthError.USER_CANCEL:
    case BiometricAuthError.SYSTEM_CANCEL:
      return 'Fingerprint verification was cancelled. Press the button to try again.';
    case BiometricAuthError.AUTHENTICATION_FAILED:
      return 'Fingerprint did not match. Please try again.';
    case BiometricAuthError.PASSCODE_NOT_SET:
      return 'Set a screen lock PIN, pattern, or fingerprint in Android Settings first.';
    default:
      return fallbackMessage || 'Device biometric authentication failed. Please try again.';
  }
}

export function isRunningNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export interface NativeBiometricStatus {
  isNative: boolean;
  isAvailable: boolean;
  hasFingerprint: boolean;
  biometryType: BiometryType;
}

export async function checkNativeBiometricAvailability(): Promise<NativeBiometricStatus> {
  if (!Capacitor.isNativePlatform()) {
    return {
      isNative: false,
      isAvailable: false,
      hasFingerprint: false,
      biometryType: BiometryType.NONE,
    };
  }
  try {
    const result: AvailableResult = await NativeBiometric.isAvailable({
      useFallback: true,
    });
    const hasFingerprint =
      result.biometryType === BiometryType.FINGERPRINT ||
      result.biometryType === BiometryType.TOUCH_ID ||
      result.biometryType === BiometryType.MULTIPLE ||
      result.strongBiometryIsAvailable;

    return {
      isNative: true,
      isAvailable: result.isAvailable,
      hasFingerprint,
      biometryType: result.biometryType,
    };
  } catch {
    return {
      isNative: true,
      isAvailable: false,
      hasFingerprint: false,
      biometryType: BiometryType.NONE,
    };
  }
}

export async function authenticateWithNativeBiometrics(
  method: BiometricMethod
): Promise<{ ok: boolean; error?: string }> {
  try {
    const status = await checkNativeBiometricAvailability();
    if (!status.isAvailable) {
      return {
        ok: false,
        error:
          'Device fingerprint is not set up on this phone. Please enroll a fingerprint in Android Settings > Security.',
      };
    }

    const allowedBiometryTypes =
      method === 'fingerprint' && status.hasFingerprint
        ? [BiometryType.FINGERPRINT, BiometryType.TOUCH_ID]
        : undefined;

    await NativeBiometric.verifyIdentity({
      title: 'Unlock Kestrel Wallet',
      subtitle:
        method === 'fingerprint'
          ? 'Verify using your device fingerprint'
          : 'Verify using device biometrics',
      description: 'Confirm your identity to access your cards and balances.',
      reason: 'Authenticate to unlock Kestrel Wallet',
      negativeButtonText: 'Cancel',
      maxAttempts: 4,
      useFallback: true,
      ...(allowedBiometryTypes ? { allowedBiometryTypes } : {}),
    });

    return { ok: true };
  } catch (err: unknown) {
    const errorObj = err as { code?: number; message?: string };
    return {
      ok: false,
      error: mapNativeBiometricError(errorObj?.code, errorObj?.message),
    };
  }
}

export async function isHardwareBiometricsSupported(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    typeof window.PublicKeyCredential === 'undefined' ||
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function'
  ) {
    return false;
  }
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function triggerWebAuthnBiometricPrompt(): Promise<{ ok: boolean; reason?: string }> {
  if (typeof navigator === 'undefined' || !navigator.credentials?.create) {
    return { ok: false, reason: 'WebAuthn is not available in this browser.' };
  }
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Kestrel Wallet' },
        user: {
          id: userId,
          name: 'elena.vance@kestrel.finance',
          displayName: 'Elena Vance',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 20000,
      },
    });

    return credential
      ? { ok: true }
      : { ok: false, reason: 'No biometric credential returned.' };
  } catch {
    return {
      ok: false,
      reason: 'Device biometrics unavailable in this context. Use the sensor scan button above.',
    };
  }
}
