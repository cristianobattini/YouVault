import BottomSheet from '@/components/BottomSheet';
import { IconName } from '@/components/IconPicker';
import Input from '@/components/Input';
import TagsPicker from '@/components/TagsPicker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { accent } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Credential } from '@/models/Credential';
import { Tag } from '@/models/Tag';
import { Octicons } from '@expo/vector-icons';
import { useQuery, useRealm } from '@realm/react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Clipboard, FlatList, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Dialog, Portal, Snackbar } from 'react-native-paper';
import { BSON, List } from 'realm';

export default function CredentialDetail() {
    const { id } = useLocalSearchParams();
    const realm = useRealm();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isArchived, setIsArchived] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showEditSheet, setShowEditSheet] = useState(false);
    const [notes, setNotes] = useState('');
    const [clipboardVisible, setClipboardVisible] = useState(false);
    const [notesVisible, setNotesVisible] = useState(false);
    const [tagSelectionVisible, setTagSelectionVisible] = useState(false);
    const [tagDeleteVisible, setTagDeleteVisible] = useState(false);
    const [selectedTag, setSelectedTag] = useState<Tag>();

    const tags: List<Tag> = useQuery(Tag) as unknown as List<Tag>;
    const textColor = useThemeColor({ light: '#1C1C1E', dark: '#FFFFFF' }, 'text');
    const subtextColor = useThemeColor({ light: '#8E8E93', dark: '#6E6E78' }, 'subtext');
    const surface = useThemeColor({ light: '#FFFFFF', dark: '#1A1A24' }, 'surface');
    const border = useThemeColor({ light: '#E5E5EA', dark: '#2A2A38' }, 'border');
    const iconColor = textColor;

    const navigation = useNavigation();

    const credential = realm.objectForPrimaryKey<Credential>('Credential', new BSON.ObjectId(id as string));

    useEffect(() => {
        setIsFavorite(credential?.isFavorite!);
        setIsArchived(credential?.isArchived!);
        setNotes(credential?.notes ?? '');
    }, []);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            title: credential?.title || '',
            username: credential?.username || '',
            password: credential?.password || '',
            url: credential?.url || '',
        }
    });

    if (!credential) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText>Credential not found</ThemedText>
            </ThemedView>
        );
    }

    const updateCredential = (data: any) => {
        realm.write(() => {
            credential.title = data.title;
            credential.username = data.username;
            credential.password = data.password;
            credential.url = data.url;
            credential.updatedAt = new Date();
        });
        setShowEditSheet(false);
    };

    const saveNotes = () => {
        realm.write(() => { credential.notes = notes; });
        setNotesVisible(true);
        setTimeout(() => setNotesVisible(false), 2000);
    };

    const toggleFavorite = () => {
        realm.write(() => { credential.isFavorite = !credential.isFavorite; });
        setIsFavorite(!isFavorite);
    };

    const toggleArchive = () => {
        realm.write(() => { credential.isArchived = !credential.isArchived; });
        setIsArchived(!isArchived);
    };

    const openUrl = () => {
        if (!credential.url) return;
        let url = credential.url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
        Linking.openURL(url);
    };

    const copy = (value: string) => {
        Clipboard.setString(value);
        setClipboardVisible(true);
        setTimeout(() => setClipboardVisible(false), 2000);
    };

    return (
        <>
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.dispatch({ type: 'POP_TO_TOP' })} style={styles.headerBtn}>
                        <Octicons size={22} name="chevron-left" color={iconColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
                        {credential.title}
                    </Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => setShowEditSheet(true)} style={styles.headerBtn}>
                            <Octicons name="pencil" size={20} color={iconColor} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleArchive} style={styles.headerBtn}>
                            <Octicons name={isArchived ? 'inbox' : 'archive'} size={20} color={isArchived ? accent : iconColor} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tag row */}
                <View style={styles.tagRow}>
                    {credential.tags.length < tags.length && (
                        <TouchableOpacity
                            onPress={() => setTagSelectionVisible(true)}
                            style={[styles.tagChip, { backgroundColor: accent + '20', borderColor: accent }]}
                        >
                            <Octicons name="plus" size={12} color={accent} />
                            {credential.tags.length === 0 && <Text style={[styles.tagChipText, { color: accent }]}>Add tag</Text>}
                        </TouchableOpacity>
                    )}
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={credential.tags}
                        keyExtractor={t => t._id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.tagChip, { backgroundColor: item.colorHex + '22', borderColor: item.colorHex }]}
                                onPress={() => { setSelectedTag(item); setTagDeleteVisible(true); }}
                            >
                                <Octicons name={item.iconName as IconName} size={12} color={item.colorHex} />
                                <Text style={[styles.tagChipText, { color: item.colorHex }]}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ gap: 6 }}
                    />
                </View>

                {/* Credentials section — fixed height */}
                <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
                    <FieldRow
                        icon="person"
                        label="Username"
                        value={credential.username}
                        onAction={() => copy(credential.username)}
                        actionIcon="paste"
                        textColor={textColor}
                        subtextColor={subtextColor}
                        border={border}
                    />
                    <View style={[styles.divider, { backgroundColor: border }]} />
                    <FieldRow
                        icon="lock"
                        label="Password"
                        value={showPassword ? credential.password : '•'.repeat(Math.min(credential.password.length, 20))}
                        onAction={() => { copy(credential.password); setShowPassword(v => !v); }}
                        actionIcon={showPassword ? 'eye-closed' : 'eye'}
                        textColor={textColor}
                        subtextColor={subtextColor}
                        border={border}
                    />
                    <View style={[styles.divider, { backgroundColor: border }]} />
                    <FieldRow
                        icon="link"
                        label="URL"
                        value={credential.url || ''}
                        placeholder="Tap ✏️ to add a URL"
                        onAction={credential.url ? openUrl : undefined}
                        actionIcon={credential.url ? 'rocket' : undefined}
                        textColor={textColor}
                        subtextColor={subtextColor}
                        border={border}
                        isLink={!!credential.url}
                    />
                </View>

                {/* Notes — fills remaining space */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, marginBottom: 8 }}>
                    <View style={[styles.section, styles.notesSection, { backgroundColor: surface, borderColor: border }]}>
                        <View style={styles.notesHeader}>
                            <View style={styles.fieldIconWrap}>
                                <Octicons name="note" size={14} color={accent} />
                            </View>
                            <Text style={[styles.fieldLabel, { color: subtextColor }]}>Notes</Text>
                            {notes !== '' && (
                                <TouchableOpacity onPress={saveNotes} style={styles.saveNotesBtn}>
                                    <Octicons name="check-circle-fill" color={accent} size={15} />
                                    <Text style={[styles.saveNoteText, { color: accent }]}>Save note</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <TextInput
                            editable
                            multiline
                            style={[styles.notesInput, { color: textColor, flex: 1 }]}
                            onChangeText={setNotes}
                            placeholder="Add notes…"
                            placeholderTextColor={subtextColor}
                            value={notes}
                            textAlignVertical="top"
                        />
                        <View style={[styles.metaFooter, { borderTopColor: border }]}>
                            <Text style={[styles.metaText, { color: subtextColor }]}>
                                Created {credential.createdAt.toLocaleDateString()}
                            </Text>
                            <Text style={[styles.metaText, { color: subtextColor }]}>
                                Modified {credential.updatedAt.toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                </KeyboardAvoidingView>

                {/* Edit sheet */}
                <BottomSheet heightPrecentile={0.70} visible={showEditSheet} onRequestClose={() => setShowEditSheet(false)}>
                    <View style={styles.sheetContainer}>
                        <ThemedText style={styles.sheetTitle}>Edit Credential</ThemedText>
                        <Controller control={control} name="title" rules={{ required: true }}
                            render={({ field: { onChange, value } }) => (
                                <Input label="Title" placeholder="Credential name" iconName="tag" onChangeText={onChange} value={value} />
                            )} />
                        <Controller control={control} name="username" rules={{ required: true }}
                            render={({ field: { onChange, value } }) => (
                                <Input label="Username / Email" placeholder="user@example.com" iconName="user" onChangeText={onChange} value={value} />
                            )} />
                        <Controller control={control} name="password" rules={{ required: true }}
                            render={({ field: { onChange, value } }) => (
                                <Input label="Password" placeholder="••••••••" passwordVisibility iconName="lock" onChangeText={onChange} value={value} />
                            )} />
                        <Controller control={control} name="url"
                            render={({ field: { onChange, value } }) => (
                                <Input label="URL" placeholder="https://example.com" iconName="link" onChangeText={onChange} value={value} />
                            )} />
                        <View style={styles.sheetButtons}>
                            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSubmit(updateCredential)}>
                                <Text style={styles.btnPrimaryText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.btnSecondary, { borderColor: border }]} onPress={() => setShowEditSheet(false)}>
                                <Text style={[styles.btnSecondaryText, { color: textColor }]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </BottomSheet>

                {/* Tag dialogs */}
                <Portal>
                    <Dialog visible={tagSelectionVisible} onDismiss={() => setTagSelectionVisible(false)} style={{ padding: 8 }}>
                        <TagsPicker tags={tags} selectedTags={credential.tags} onTagSelect={(t) => {
                            if (!credential.tags.includes(t)) {
                                t.addCredential(realm, credential);
                                setTagSelectionVisible(false);
                            }
                        }} />
                    </Dialog>
                </Portal>
                <Portal>
                    <Dialog visible={tagDeleteVisible} onDismiss={() => setTagDeleteVisible(false)}>
                        <Dialog.Content><ThemedText type="subtitle">Remove tag?</ThemedText></Dialog.Content>
                        <Dialog.Actions>
                            <Button buttonColor="#EF4444" textColor="#fff" style={{ borderRadius: 8 }} onPress={() => {
                                selectedTag?.removeCredential(realm, credential);
                                setTagDeleteVisible(false);
                            }}>Remove</Button>
                            <Button onPress={() => setTagDeleteVisible(false)}>Cancel</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
                {/* Favourite FAB */}
                <TouchableOpacity
                    onPress={toggleFavorite}
                    style={[styles.favFab, { backgroundColor: isFavorite ? '#F59E0B' : surface, borderColor: isFavorite ? '#F59E0B' : border }]}
                    activeOpacity={0.8}
                >
                    <Octicons name={isFavorite ? 'star-fill' : 'star'} size={26} color={isFavorite ? '#fff' : subtextColor} />
                </TouchableOpacity>
            </ThemedView>

            <Snackbar visible={clipboardVisible} onDismiss={() => {}}>Copied to clipboard.</Snackbar>
            <Snackbar visible={notesVisible} onDismiss={() => {}} style={{ backgroundColor: '#10B981' }}>Notes saved.</Snackbar>
        </>
    );
}

function FieldRow({ icon, label, value, placeholder, onAction, actionIcon, textColor, subtextColor, border, isLink = false }: {
    icon: string;
    label: string;
    value: string;
    placeholder?: string;
    onAction?: () => void;
    actionIcon?: string;
    textColor: string;
    subtextColor: string;
    border: string;
    isLink?: boolean;
}) {
    const isEmpty = !value;
    return (
        <View style={styles.fieldRow}>
            <View style={styles.fieldLeft}>
                <View style={[styles.fieldIconWrap, isEmpty && { opacity: 0.4 }]}>
                    <Octicons name={icon as any} size={14} color={accent} />
                </View>
                <View style={styles.fieldText}>
                    <Text style={[styles.fieldLabel, { color: subtextColor }]}>{label}</Text>
                    <Text
                        style={[
                            styles.fieldValue,
                            { color: isEmpty ? subtextColor : isLink ? accent : textColor },
                            isEmpty && { fontStyle: 'italic', fontSize: 13 },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {isEmpty ? placeholder : value}
                    </Text>
                </View>
            </View>
            {actionIcon && (
                <TouchableOpacity onPress={onAction} style={styles.fieldAction} hitSlop={8}>
                    <Octicons name={actionIcon as any} size={18} color={accent} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        gap: 8,
        marginBottom: 8,
    },
    headerBtn: { padding: 6 },
    favFab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
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
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },
    headerActions: { flexDirection: 'row', gap: 2 },

    tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    tagChipText: { fontSize: 12, fontWeight: '600' },

    section: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 12,
    },

    divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },

    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    fieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    fieldIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: accent + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fieldText: { flex: 1, gap: 2 },
    fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
    fieldValue: { fontSize: 15, fontWeight: '500' },
    fieldAction: { paddingLeft: 12 },

    notesSection: { flex: 1, marginBottom: 0 },
    notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
    saveNotesBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 },
    saveNoteText: { fontSize: 13, fontWeight: '600' },
    notesInput: { fontSize: 15, paddingHorizontal: 16, paddingTop: 4 },

    metaFooter: { flexDirection: 'row', gap: 12, justifyContent: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
    metaText: { fontSize: 11 },

    sheetContainer: { paddingBottom: 4 },
    sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, letterSpacing: -0.4 },
    sheetButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
    btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    btnPrimary: { backgroundColor: accent },
    btnSecondary: { borderWidth: 1.5 },
    btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    btnSecondaryText: { fontWeight: '600', fontSize: 15 },
});
