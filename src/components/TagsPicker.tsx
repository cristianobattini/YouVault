import { useThemeColor } from '@/hooks/useThemeColor';
import { Tag } from '@/models/Tag';
import { Octicons } from '@expo/vector-icons';
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, FlatList } from 'react-native';
import { IconName } from './IconPicker';
import { List } from 'realm';

type TagsPickerProps = {
    selectedTags: List<Tag>;
    tags: List<Tag>;
    onTagSelect: (tag: Tag) => void;
    onCreateNew?: () => void;
};

export default function TagsPicker({
    selectedTags,
    tags,
    onTagSelect,
    onCreateNew,
}: TagsPickerProps) {
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'text');

    const filteredTags = tags.filter(x => !selectedTags.includes(x));

    const isSelected = (tag: Tag) => {
        return selectedTags.some(t => t._id === tag._id);
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredTags}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item._id.toString()}
                renderItem={({ item: tag }) => (
                    <TouchableOpacity
                        style={[
                            styles.tagOption,
                            isSelected(tag) && styles.selectedTag,
                            { backgroundColor: tag.colorHex + '20' },
                        ]}
                        onPress={() => onTagSelect(tag)}
                    >
                        <Octicons name={tag.iconName as IconName ?? 'tag'} size={18} />
                        <Text
                            style={[
                                styles.tagText,
                                { color: textColor },
                                isSelected(tag) && { color: tag.colorHex, fontWeight: 'bold' }
                            ]}
                        >
                            {tag.name}
                        </Text>
                        {isSelected(tag) && (
                            <View style={[styles.checkMark, { borderColor: tag.colorHex }]} />
                        )}
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.container}
            />

            {onCreateNew && (
                <TouchableOpacity
                    style={[styles.tagOption, styles.newTagButton, { borderColor }]}
                    onPress={onCreateNew}
                >
                    <Text style={[styles.tagText, { color: textColor }]}>+ New</Text>
                </TouchableOpacity>
            )}
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
    tagOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 5,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'transparent',
        position: 'relative',
    },
    selectedTag: {
        borderWidth: 1,
    },
    tagText: {
        fontSize: 16,
    },
    newTagButton: {
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
    },
    checkMark: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'white',
        borderWidth: 1,
    },
});
