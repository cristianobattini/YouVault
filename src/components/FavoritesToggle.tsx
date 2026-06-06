import { Octicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Animated, StyleSheet, TouchableWithoutFeedback } from "react-native";

const FavoritesToggle = ({
  onToggleFavorite,
  onToggleNotFavorite,
  initialValue = false
}: {
  onToggleFavorite: Function,
  onToggleNotFavorite: Function,
  initialValue?: boolean
}) => {
  const [isActive, setIsActive] = useState(initialValue);
  const animationSpeed = 200;

  const switchWidth = 80;
  const switchHeight = 40;
  const buttonSize = 34;
  const buttonPadding = 3;

  const translateXRange = switchWidth - buttonSize - (buttonPadding * 2);

  const activeBgColor = "#FFECEC";
  const inactiveBgColor = "#f5f5f5";
  const activeColor = "orange";
  const inactiveColor = "#FAD5A5";

  const translateXAnim = useRef(new Animated.Value(initialValue ? translateXRange : 0)).current;
  const bgColorAnim = useRef(new Animated.Value(initialValue ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const bgColor = bgColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveBgColor, activeBgColor]
  });

  const toggleSwitch = () => {
    const newValue = !isActive;
    setIsActive(newValue);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: animationSpeed / 2,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: animationSpeed / 2,
        useNativeDriver: true
      })
    ]).start();

    Animated.parallel([
      Animated.timing(translateXAnim, {
        toValue: newValue ? translateXRange : 0,
        duration: animationSpeed,
        useNativeDriver: true
      }),
      Animated.timing(bgColorAnim, {
        toValue: newValue ? 1 : 0,
        duration: animationSpeed,
        useNativeDriver: false
      })
    ]).start();

    if (newValue) {
      onToggleFavorite();
    } else {
      onToggleNotFavorite();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={toggleSwitch}>
      <Animated.View style={[
        styles.switchContainer,
        {
          width: switchWidth,
          height: switchHeight,
          backgroundColor: bgColor,
          borderRadius: switchHeight / 2
        }
      ]}>
        <Animated.View style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            transform: [
              { translateX: translateXAnim },
              { scale: scaleAnim }
            ],
            backgroundColor: 'white',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1,
          }
        ]}>
          <Octicons
            name={isActive ? "star-fill" : "star"}
            size={20}
            color={isActive ? activeColor : inactiveColor}
          />
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    justifyContent: 'center',
    padding: 3,
  },
  button: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FavoritesToggle;
