import { Octicons } from "@expo/vector-icons";
import { useState } from "react";
import { TouchableOpacity } from "react-native";

const FavoritesToggle = ({
  onToggleFavorite,
  onToggleNotFavorite,
  initialValue = false
}: {
  onToggleFavorite: () => void;
  onToggleNotFavorite: () => void;
  initialValue?: boolean;
}) => {
  const [isActive, setIsActive] = useState(initialValue);

  const toggle = () => {
    const next = !isActive;
    setIsActive(next);
    if (next) onToggleFavorite();
    else onToggleNotFavorite();
  };

  return (
    <TouchableOpacity onPress={toggle} style={{ padding: 8 }} hitSlop={4}>
      <Octicons
        name={isActive ? "star-fill" : "star"}
        size={20}
        color={isActive ? "#F59E0B" : "#8E8E93"}
      />
    </TouchableOpacity>
  );
};

export default FavoritesToggle;
