import { KeyboardAvoidingContext } from '@/components/store/KeyboardAvoidingProvider';
import { useContext } from 'react';

export default function useKeyboardAvoiding() {
  return useContext(KeyboardAvoidingContext);
}
