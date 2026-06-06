import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const KEY = 'biometricEnabled';

export const BiometricService = {
  isSupported: async () => {
    const hw = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hw && enrolled;
  },

  isEnabled: async () => {
    try {
      const value = await SecureStore.getItemAsync(KEY);
      return value === 'true';
    } catch (error) {
      console.log('SecureStore read error:', error);
      return false;
    }
  },

  setEnabled: async (v: boolean) => {
    try {
      await SecureStore.setItemAsync(KEY, v ? 'true' : 'false');
    } catch (error) {
      console.log('SecureStore write error:', error);
    }
  },

  authenticate: async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access YouVault',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  },
};
