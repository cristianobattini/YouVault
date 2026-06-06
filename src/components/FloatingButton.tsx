import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { FontAwesome, Octicons } from '@expo/vector-icons';

type FontAwesomeIconNames = keyof typeof FontAwesome.glyphMap;

interface ActionButtonProps {
  iconName: FontAwesomeIconNames;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FloatingMenuButtonProps {
  actions: ActionButtonProps[];
  mainButtonColor?: string;
  buttonSize?: number;
}

const FloatingMenuButton: React.FC<FloatingMenuButtonProps> = ({
  actions,
  mainButtonColor = "#000",
  buttonSize = 60
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useState(new Animated.Value(0))[0];

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.timing(animation, {
      toValue,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    setIsOpen(!isOpen);
  };

  const rotateInterpolation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const actionButtons = actions.map((action, index) => {
    const distance = (buttonSize * 1.2) * (index + 1);

    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -distance],
    });

    const opacity = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.actionButton,
          {
            backgroundColor: action.color || '#555',
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            action.onPress();
            toggleMenu();
          }}
          style={styles.fullSizeButton}
        >
          <View style={styles.buttonContent}>
            <FontAwesome name={action.iconName} size={buttonSize * 0.4} color="white" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  });

  return (
    <View style={styles.container}>
      {actionButtons.reverse()}
      <TouchableOpacity
        style={[
          styles.mainButton,
          {
            backgroundColor: mainButtonColor,
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          }
        ]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
          <Octicons name="plus" size={buttonSize * 0.4} color="white" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mainButton: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fullSizeButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FloatingMenuButton;
