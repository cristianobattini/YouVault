import { accent } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Octicons } from '@expo/vector-icons';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

const ICONS = [
    'check', 'search', 'plus', 'gear', 'home', 'heart', 'star',
    'alert', 'bookmark', 'bell', 'calendar', 'comment', 'code',
    'flame', 'gift', 'key', 'link', 'lock', 'mail', 'moon', 'person'
] as const;

export type IconName = typeof ICONS[number];

export default function IconPicker({ selectedIcon, onIconSelect }: {
    selectedIcon: IconName | undefined;
    onIconSelect: (icon: IconName) => void
}) {
    const iconColor = useThemeColor({ light: '#1C1C1E', dark: '#FFFFFF' }, 'text');
    const buttonBg = useThemeColor({ light: '#F0F0F5', dark: '#2A2A38' }, 'surface');

    return (
        <View style={styles.container}>
            {ICONS.map((icon) => {
                const isSelected = selectedIcon === icon;
                return (
                    <TouchableOpacity
                        key={icon}
                        style={[
                            styles.iconOption,
                            { backgroundColor: isSelected ? accent + '30' : buttonBg },
                            isSelected && { borderColor: accent, borderWidth: 1.5 },
                        ]}
                        onPress={() => onIconSelect(icon)}
                    >
                        <Octicons
                            name={icon}
                            size={22}
                            color={isSelected ? accent : iconColor}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingVertical: 4,
    },
    iconOption: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
