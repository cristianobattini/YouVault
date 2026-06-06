import { useThemeColor } from '@/hooks/useThemeColor';
import { Credential } from '@/models/Credential';
import { Octicons } from '@expo/vector-icons';
import { useRealm } from '@realm/react';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Button, Dialog, Portal } from 'react-native-paper';

const AVATAR_PALETTE = ['#015aea', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#F97316'];

function avatarColor(title: string): string {
    return AVATAR_PALETTE[title.charCodeAt(0) % AVATAR_PALETTE.length];
}

const CredentialCard = ({ item }: { item: Credential }) => {
    const realm = useRealm();
    const [credentialDelete, setCredentialDelete] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);

    const surface = useThemeColor({ light: '#FFFFFF', dark: '#1A1A24' }, 'surface');
    const textPrimary = useThemeColor({ light: '#1C1C1E', dark: '#FFFFFF' }, 'text');
    const textSecondary = useThemeColor({ light: '#8E8E93', dark: '#6E6E78' }, 'subtext');
    const border = useThemeColor({ light: '#F0F0F5', dark: '#2A2A38' }, 'border');

    const tagColor = item.tags.length > 0 ? item.tags[0].colorHex : avatarColor(item.title || '?');

    const toggleFavorite = () => {
        if (isDeleted) return;
        realm.write(() => {
            const c = realm.objectForPrimaryKey<Credential>('Credential', item._id);
            if (c) c.isFavorite = !c.isFavorite;
        });
    };

    const toggleArchived = () => {
        if (isDeleted) return;
        realm.write(() => {
            const c = realm.objectForPrimaryKey<Credential>('Credential', item._id);
            if (c) c.isArchived = !c.isArchived;
        });
    };

    const handleDelete = () => {
        realm.write(() => {
            const c = realm.objectForPrimaryKey<Credential>('Credential', item._id);
            if (c) {
                realm.delete(c);
                setIsDeleted(true);
            }
        });
        setCredentialDelete(false);
    };

    if (isDeleted) return null;

    return (
        <>
            <Swipeable
                renderLeftActions={() => (
                    <RectButton style={styles.swipeDelete} onPress={() => setCredentialDelete(true)}>
                        <Octicons name="trash" size={22} color="#fff" />
                    </RectButton>
                )}
                renderRightActions={() => (
                    <RectButton style={styles.swipeArchive} onPress={toggleArchived}>
                        <Octicons name="archive" size={22} color="#fff" />
                    </RectButton>
                )}
                leftThreshold={40}
                rightThreshold={40}
            >
                <Link href={{ pathname: '/credential-detail', params: { id: item._id.toString() } }} asChild>
                    <TouchableOpacity activeOpacity={0.7}>
                        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
                            <View style={[styles.avatar, { backgroundColor: tagColor + '22' }]}>
                                <Text style={[styles.avatarLetter, { color: tagColor }]}>
                                    {(item.title[0] || '?').toUpperCase()}
                                </Text>
                            </View>

                            <View style={styles.info}>
                                <Text style={[styles.title, { color: textPrimary }]} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.username, { color: textSecondary }]} numberOfLines={1}>
                                    {item.username}
                                </Text>
                            </View>

                            <TouchableOpacity onPress={toggleFavorite} hitSlop={8} style={styles.starButton}>
                                <Octicons
                                    name={item.isFavorite ? 'star-fill' : 'star'}
                                    size={20}
                                    color={item.isFavorite ? '#F59E0B' : textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Link>
            </Swipeable>

            <Portal>
                <Dialog visible={credentialDelete} onDismiss={() => setCredentialDelete(false)}>
                    <Dialog.Content>
                        <Text style={{ fontSize: 17, fontWeight: '600' }}>Delete "{item.title}"?</Text>
                        <Text style={{ marginTop: 6, color: '#8E8E93' }}>This action cannot be undone.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setCredentialDelete(false)}>Cancel</Button>
                        <Button buttonColor="#EF4444" textColor="#fff" style={{ borderRadius: 8 }} onPress={handleDelete}>
                            Delete
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    avatarLetter: {
        fontSize: 18,
        fontWeight: '700',
    },
    info: {
        flex: 1,
        gap: 3,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
    username: {
        fontSize: 13,
    },
    starButton: {
        paddingLeft: 8,
    },
    swipeDelete: {
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        marginBottom: 8,
        width: 70,
    },
    swipeArchive: {
        backgroundColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        marginBottom: 8,
        width: 70,
    },
});

export default CredentialCard;
