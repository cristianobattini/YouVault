import { Octicons } from '@expo/vector-icons';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

const COLORS = [
    '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
    '#00C7BE', '#30B0C7', '#007AFF', '#5856D6',
    '#AF52DE', '#FF2D55', '#808080'
];

export default function ColorPicker({ selectedColor, onColorSelect }: {
    selectedColor: string;
    onColorSelect: (color: string) => void
}) {
    return (
        <View style={styles.container}>
            {COLORS.map((color) => (
                <TouchableOpacity
                    key={color}
                    style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColor,
                    ]}
                    onPress={() => onColorSelect(color)}
                >
                    {selectedColor == color ? <Octicons name='check' size={20} style={{ color: '#fff' }} /> : null}
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    selectedColor: {
        borderWidth: 2,
        borderColor: 'white',
    },
});
