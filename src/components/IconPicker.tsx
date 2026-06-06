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
    const textColor = useThemeColor({}, 'text');

    return (
        <View style={styles.container}>
            {ICONS.map((icon) => (
                <TouchableOpacity
                    key={icon}
                    style={[
                        styles.iconOption,
                        selectedIcon === icon && styles.selectedIcon,
                    ]}
                    onPress={() => onIconSelect(icon)}
                >
                    <Octicons
                        name={icon}
                        size={24}
                        color={selectedIcon === icon ? 'green' : textColor}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        padding: 8,
    },
    iconOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        position: 'relative',
    },
    selectedIcon: {
        backgroundColor: '#90EE9040',
        borderWidth: 1,
        borderColor: 'green',
    },
});
