import { useThemeColor } from '@/hooks/useThemeColor';
import { FontAwesome } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';

interface BottomSheetProps {
  visible: boolean;
  children: React.ReactElement;
  heightPrecentile: number;
  onRequestClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

const BottomSheet = ({ visible, children, heightPrecentile, onRequestClose }: BottomSheetProps) => {
  const [animatedValue] = useState(new Animated.Value(0));
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#1A1A24' }, 'surface');
  const iconColor = useThemeColor({ light: '#1C1C1E', dark: '#FFFFFF' }, 'text');
  const maxHeight = SCREEN_HEIGHT * heightPrecentile;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  // Slide from off-screen bottom — content height determines actual size
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Animated.View
            style={[
              styles.sheet,
              { transform: [{ translateY }], maxHeight, backgroundColor },
            ]}
          >
            <TouchableOpacity onPress={onRequestClose} style={styles.closeBtn}>
              <FontAwesome size={22} name="close" color={iconColor} />
            </TouchableOpacity>
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
});

export default BottomSheet;
