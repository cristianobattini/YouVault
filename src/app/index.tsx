import BottomSheet from '@/components/BottomSheet';
import ColorPicker from '@/components/ColorPickers';
import CredentialCard from '@/components/CredentialCard';
import FloatingMenuButton from '@/components/FloatingButton';
import IconPicker, { IconName } from '@/components/IconPicker';
import Input from '@/components/Input';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { accent } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Credential } from '@/models/Credential';
import { Tag } from '@/models/Tag';
import { Octicons } from '@expo/vector-icons';
import { useQuery, useRealm } from '@realm/react';
import { ObjectId } from 'bson';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Animated, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BSON } from 'realm';

const Index = () => {
    const realm = useRealm();
    const credentials = useQuery(Credential);
    const tags = useQuery(Tag);
    const [selectedTag, setSelectedTag] = useState<BSON.ObjectId | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [showFavorites, setShowFavorites] = useState(false);
    const [showCredentialSheet, setShowCredentialSheet] = useState(false);
    const [showTagSheet, setShowTagSheet] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#808080');
    const [selectedIcon, setSelectedIcon] = useState<IconName | undefined>(undefined);
    const [tagModalVisible, setTagModalVisible] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);

    const { control: credentialControl, handleSubmit: handleCredentialSubmit, reset: resetCredentialForm } = useForm();
    const { control: tagControl, handleSubmit: handleTagSubmit, reset: resetTagForm } = useForm();

    const modalAnim = useState(new Animated.Value(0))[0];

    const modalBg = useThemeColor({ light: '#fff', dark: '#1A1A24' }, 'surface');
    const surface = useThemeColor({ light: '#FFFFFF', dark: '#1A1A24' }, 'surface');
    const iconColor = useThemeColor({ light: '#1C1C1E', dark: '#FFFFFF' }, 'text');
    const subtextColor = useThemeColor({ light: '#8E8E93', dark: '#6E6E78' }, 'subtext');
    const borderColor = useThemeColor({ light: '#E5E5EA', dark: '#2A2A38' }, 'border');

    const filteredCredentials = (selectedTag
        ? credentials.filtered('ANY tags._id == $0', selectedTag)
        : credentials
    ).filter(x => showArchived ? x.isArchived : !x.isArchived)
     .filter(x => showFavorites ? x.isFavorite : true);

    const handleCreateNewCredential = (data: any) => {
        realm.write(() => {
            const newCredential = realm.create(Credential, {
                _id: new BSON.ObjectId(),
                title: data.title,
                username: data.username,
                password: data.password,
                url: data.url || '',
                notes: data.notes || '',
                createdAt: new Date(),
                updatedAt: new Date(),
                isFavorite: false,
                isArchived: false,
            });
            if (selectedTag) {
                const tag = realm.objectForPrimaryKey<Tag>(Tag, selectedTag);
                if (tag) tag.credentials.push(newCredential);
            }
        });
        setShowCredentialSheet(false);
        resetCredentialForm();
    };

    const handleCreateTag = (data: any) => {
        realm.write(() => {
            if (editingTag) {
                realm.create(Tag, { ...editingTag, name: data.name, colorHex: selectedColor, iconName: selectedIcon }, Realm.UpdateMode.Modified);
                setEditingTag(null);
            } else {
                realm.create(Tag, { _id: new BSON.ObjectId(), name: data.name, colorHex: selectedColor, iconName: selectedIcon, credentials: [] });
            }
        });
        setShowTagSheet(false);
        resetTagForm();
        setEditingTag(null);
    };

    const deleteTag = (id: ObjectId) => {
        realm.write(() => {
            const t = realm.objectForPrimaryKey(Tag, id);
            if (t) realm.delete(t);
        });
    };

    useEffect(() => {
        Animated.spring(modalAnim, { toValue: tagModalVisible ? 1 : 0, useNativeDriver: true }).start();
    }, [tagModalVisible]);

    return (
        <>
            {/* Create credential sheet */}
            <BottomSheet heightPrecentile={0.75} visible={showCredentialSheet} onRequestClose={() => setShowCredentialSheet(false)}>
                <View style={styles.sheetContainer}>
                    <ThemedText style={styles.sheetTitle}>New Credential</ThemedText>
                    <Controller control={credentialControl} name="title" rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                            <Input label="Title" placeholder="Credential name" iconName="tag" onChangeText={onChange} value={value} />
                        )} />
                    <Controller control={credentialControl} name="username" rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                            <Input label="Username / Email" placeholder="user@example.com" iconName="user" onChangeText={onChange} value={value} />
                        )} />
                    <Controller control={credentialControl} name="password" rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                            <Input label="Password" placeholder="••••••••" passwordVisibility iconName="key" onChangeText={onChange} value={value} />
                        )} />
                    <Controller control={credentialControl} name="url"
                        render={({ field: { onChange, value } }) => (
                            <Input label="URL (optional)" placeholder="https://example.com" iconName="link" onChangeText={onChange} value={value} />
                        )} />
                    <View style={styles.sheetButtons}>
                        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleCredentialSubmit(handleCreateNewCredential)}>
                            <Text style={styles.btnTextPrimary}>Create</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnSecondary, { borderColor }]} onPress={() => setShowCredentialSheet(false)}>
                            <Text style={[styles.btnTextSecondary, { color: iconColor }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BottomSheet>

            {/* Create tag sheet */}
            <BottomSheet heightPrecentile={0.90} visible={showTagSheet} onRequestClose={() => { setShowTagSheet(false); setEditingTag(null); }}>
                <View style={styles.sheetContainer}>
                    <ThemedText style={styles.sheetTitle}>{editingTag ? 'Edit Tag' : 'New Tag'}</ThemedText>
                    <View style={styles.sheetSection}>
                        <ThemedText style={styles.sheetSectionLabel}>Color</ThemedText>
                        <ColorPicker selectedColor={selectedColor} onColorSelect={setSelectedColor} />
                    </View>
                    <View style={styles.sheetSection}>
                        <ThemedText style={styles.sheetSectionLabel}>Icon</ThemedText>
                        <IconPicker onIconSelect={setSelectedIcon} selectedIcon={selectedIcon} />
                    </View>
                    <Controller control={tagControl} name="name" rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                            <Input label="Tag Name" placeholder="Work, Personal…" iconName="tag" onChangeText={onChange} value={value} />
                        )} />
                    <View style={styles.sheetButtons}>
                        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleTagSubmit(handleCreateTag)}>
                            <Text style={styles.btnTextPrimary}>{editingTag ? 'Save' : 'Create'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnSecondary, { borderColor }]} onPress={() => setShowTagSheet(false)}>
                            <Text style={[styles.btnTextSecondary, { color: iconColor }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BottomSheet>

            {/* Main */}
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.logoMark}>
                            <Octicons name="lock" size={15} color="#fff" />
                        </View>
                        <Text style={[styles.headerTitle, { color: iconColor }]}>YouVault</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={() => setShowArchived(!showArchived)} style={styles.headerIconBtn}>
                            <Octicons name={showArchived ? 'inbox' : 'archive'} size={20} color={showArchived ? accent : subtextColor} />
                        </TouchableOpacity>
                        <Link href="/settings" asChild>
                            <TouchableOpacity style={styles.headerIconBtn}>
                                <Octicons name="gear" size={20} color={subtextColor} />
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                {/* Tags */}
                {tags.length > 0 && (
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={tags}
                        keyExtractor={t => t._id.toString()}
                        style={styles.tagListScroll}
                        contentContainerStyle={styles.tagList}
                        renderItem={({ item }) => {
                            const active = selectedTag?.equals(item._id);
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.tagChip,
                                        { backgroundColor: active ? item.colorHex : item.colorHex + '22', borderColor: item.colorHex },
                                    ]}
                                    onPress={() => setSelectedTag(active ? null : item._id)}
                                    onLongPress={() => { setEditingTag(item); setTagModalVisible(true); }}
                                    delayLongPress={350}
                                >
                                    <Octicons
                                        name={active ? 'x' : (item.iconName as IconName)}
                                        size={13}
                                        color={active ? '#fff' : item.colorHex}
                                    />
                                    <Text style={[styles.tagChipText, { color: active ? '#fff' : item.colorHex }]}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}

                {showArchived && (
                    <View style={styles.archivedBadge}>
                        <Octicons name="archive" size={13} color={accent} />
                        <Text style={[styles.archivedText, { color: accent }]}>Archived</Text>
                    </View>
                )}

                {/* List */}
                {filteredCredentials.length === 0 ? (
                    <View style={styles.empty}>
                        <View style={styles.emptyIcon}>
                            <Octicons name="lock" size={32} color={accent} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: iconColor }]}>
                            {showArchived ? 'No archived items' : 'No credentials yet'}
                        </Text>
                        <Text style={[styles.emptySubtext, { color: subtextColor }]}>
                            {showArchived ? 'Swipe left on a credential to archive it' : 'Tap + to add your first credential'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredCredentials}
                        keyExtractor={item => item._id.toHexString()}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => <CredentialCard item={item} />}
                        showsVerticalScrollIndicator={false}
                    />
                )}
                {/* Favourites FAB — bottom left */}
                <TouchableOpacity
                    onPress={() => setShowFavorites(v => !v)}
                    style={[styles.favFab, { backgroundColor: showFavorites ? '#F59E0B' : surface, borderColor: showFavorites ? '#F59E0B' : borderColor }]}
                    activeOpacity={0.8}
                >
                    <Octicons name={showFavorites ? 'star-fill' : 'star'} size={24} color={showFavorites ? '#fff' : subtextColor} />
                </TouchableOpacity>
            </ThemedView>

            <FloatingMenuButton
                mainButtonColor={accent}
                actions={[
                    { iconName: 'key', label: 'Credential', onPress: () => setShowCredentialSheet(true), color: '#dccb12' },
                    { iconName: 'tag', label: 'Tag', onPress: () => { setEditingTag(null); setShowTagSheet(true); }, color: '#8B5CF6' },
                ]}
            />

            {/* Tag context modal */}
            <Modal animationType="none" transparent visible={tagModalVisible} onRequestClose={() => { setEditingTag(null); setTagModalVisible(false); }}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setEditingTag(null); setTagModalVisible(false); }}>
                    <Animated.View
                        style={[
                            styles.modalCard,
                            { backgroundColor: modalBg, opacity: modalAnim, transform: [{ scale: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] },
                        ]}
                    >
                        <TouchableOpacity onPress={() => { setTagModalVisible(false); setEditingTag(null); }} style={styles.modalHeader}>
                            <Text style={[styles.modalTagName, { color: iconColor }]}>
                                {editingTag?.name ?? 'Tag'}
                            </Text>
                            <Octicons name="x" size={18} color={subtextColor} />
                        </TouchableOpacity>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: '#F59E0B' }]}
                                onPress={() => {
                                    if (editingTag) {
                                        setShowTagSheet(true);
                                        setTagModalVisible(false);
                                        resetTagForm({ name: editingTag.name });
                                        setSelectedColor(editingTag.colorHex);
                                        setSelectedIcon(editingTag.iconName as IconName);
                                    }
                                }}
                            >
                                <Octicons name="pencil" color="#fff" size={16} />
                                <Text style={styles.modalBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: '#EF4444' }]}
                                onPress={() => {
                                    if (editingTag) deleteTag(editingTag._id);
                                    setTagModalVisible(false);
                                    setEditingTag(null);
                                }}
                            >
                                <Octicons name="trash" color="#fff" size={16} />
                                <Text style={styles.modalBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        marginBottom: 4,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    logoMark: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
    headerIconBtn: { padding: 8 },
    favFab: {
        position: 'absolute',
        bottom: 5,
        left: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },

    // Tags
    tagListScroll: { height: 50, flexGrow: 0, flexShrink: 0 },
    tagList: { gap: 8, alignItems: 'center' },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    tagChipText: { fontSize: 13, fontWeight: '600' },

    archivedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 4,
        marginTop: 2,
    },
    archivedText: { fontSize: 13, fontWeight: '600' },

    // List
    list: { paddingTop: 4, paddingBottom: 100 },

    // Empty state
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 22,
        backgroundColor: accent + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyTitle: { fontSize: 17, fontWeight: '600' },
    emptySubtext: { fontSize: 14, textAlign: 'center', maxWidth: 220 },

    // Sheet
    sheetContainer: { paddingBottom: 4 },
    sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, letterSpacing: -0.4 },
    sheetSection: { marginBottom: 16 },
    sheetSectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.5 },
    sheetButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
    btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    btnPrimary: { backgroundColor: accent },
    btnSecondary: { borderWidth: 1.5 },
    btnTextPrimary: { color: '#fff', fontWeight: '700', fontSize: 15 },
    btnTextSecondary: { fontWeight: '600', fontSize: 15 },

    // Tag modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
    modalCard: {
        width: '80%',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTagName: { fontSize: 17, fontWeight: '700' },
    modalActions: { flexDirection: 'row', gap: 10 },
    modalBtn: {
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default Index;
