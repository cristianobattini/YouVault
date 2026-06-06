import { createContext, ReactNode, useEffect, useRef } from 'react';
import { Animated, Keyboard, TextInput, Platform, Dimensions } from 'react-native';

interface KeyboardAvoidingContextType {
  animatedTranslateY: Animated.Value;
}

export const KeyboardAvoidingContext = createContext<KeyboardAvoidingContextType>({
  animatedTranslateY: new Animated.Value(0),
});

export const KeyboardAvoidingProvider = ({
  children,
  extraPadding = 20,
  duration = 250,
}: {
  children: ReactNode;
  extraPadding?: number;
  duration?: number;
}) => {
  const animatedTranslateY = useRef(new Animated.Value(0)).current;
  const windowHeight = Dimensions.get('window').height;

  useEffect(() => {
    const keyboardWillShow = (e: any) => {
      const { endCoordinates } = e;
      const keyboardHeight = endCoordinates.height;

      TextInput.State.currentlyFocusedInput()?.measure((x, y, width, height, pageX, pageY) => {
        const inputBottom = pageY + height;
        const keyboardTop = windowHeight - keyboardHeight;
        const distanceToKeyboard = inputBottom - keyboardTop;

        if (distanceToKeyboard > 0) {
          const translateValue = -(distanceToKeyboard + extraPadding);
          Animated.timing(animatedTranslateY, {
            toValue: translateValue,
            duration,
            useNativeDriver: true,
          }).start();
        }
      });
    };

    const keyboardWillHide = () => {
      Animated.timing(animatedTranslateY, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }).start();
    };

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      keyboardWillShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      keyboardWillHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [windowHeight]);

  return (
    <KeyboardAvoidingContext.Provider value={{ animatedTranslateY }}>
      {children}
    </KeyboardAvoidingContext.Provider>
  );
};
