import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { Credential } from '@/models/Credential';
import { useRealm } from '@realm/react';
import { Octicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Link } from 'expo-router';
import { Button, Dialog, Portal } from 'react-native-paper';

const CredentialCard = ({ item }: { item: Credential }) => {
    const realm = useRealm();
    const [credentialDelete, setCredentialDelete] = useState<boolean>(false);
    const [isDeleted, setIsDeleted] = useState(false);

    const cardBackgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'text');

    const toggleFavorite = () => {
        if (isDeleted) return;

        realm.write(() => {
            const credential = realm.objectForPrimaryKey<Credential>('Credential', item._id);
            if (credential) {
                credential.isFavorite = !credential.isFavorite;
            }
        });
    };

    const toggleArchived = () => {
        if (isDeleted) return;

        realm.write(() => {
            const credential = realm.objectForPrimaryKey<Credential>('Credential', item._id);
            if (credential) {
                credential.isArchived = !credential.isArchived;
            }
        });
    };

    const handleDeleteCredential = () => {
        realm.write(() => {
            const credential = realm.objectForPrimaryKey<Credential>('Credential', item._id);
            if (credential) {
                realm.delete(credential);
                setIsDeleted(true);
            }
        });
        setCredentialDelete(false);
    };

    const renderLeftActions = () => {
        return (
            <RectButton
                style={styles.deleteButton}
                onPress={() => setCredentialDelete(true)}
            >
                <View style={styles.actionContent}>
                    <Octicons name='trash' size={24} color={'white'} />
                </View>
            </RectButton>
        );
    };

    const renderRightActions = () => {
        return (
            <RectButton
                style={styles.archiveButton}
                onPress={toggleArchived}
            >
                <View style={styles.actionContent}>
                    <Octicons name='archive' size={24} color={'white'} />
                </View>
            </RectButton>
        );
    };

    if (isDeleted) {
        return null;
    }

    return (
        <>
            <Swipeable
                renderLeftActions={renderLeftActions}
                renderRightActions={renderRightActions}
                leftThreshold={30}
                rightThreshold={30}
            >
                <View style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
                    <Link href={{
                        pathname: "/credential-detail",
                        params: { id: item._id.toString() }
                    }}>
                        <View style={styles.leftContent}>
                            <Image
                                source={require('@/assets/images/key.png')}
                                style={styles.keyImage}
                            />
                            <View style={styles.textContainer}>
                                <ThemedText type='subtitle'>{item.title}</ThemedText>
                                <ThemedText type='default'>{item.username}</ThemedText>
                            </View>
                        </View>
                    </Link>
                    <TouchableOpacity onPress={toggleFavorite}>
                        <Octicons name={item.isFavorite ? 'star-fill' : 'star'} color={'orange'} size={26} />
                    </TouchableOpacity>
                </View>
            </Swipeable>

            <Portal>
                <Dialog
                    visible={credentialDelete}
                    onDismiss={() => setCredentialDelete(false)}
                >
                    <Dialog.Content><ThemedText type='subtitle'>Delete credential?</ThemedText></Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            buttonColor='red'
                            style={{ borderRadius: 10 }}
                            textColor='white'
                            onPress={handleDeleteCredential}
                        >
                            Delete
                        </Button>
                        <Button onPress={() => setCredentialDelete(false)}>
                            Cancel
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
        justifyContent: 'space-between',
        borderRadius: 8,
        padding: 10,
        marginBottom: 2,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    textContainer: {
        gap: 10,
        flexDirection: 'row'
    },
    keyImage: {
        width: 24,
        height: 24,
    },
    deleteButton: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'flex-end',
        borderRadius: 8,
        marginBottom: 2,
        width: 70,
    },
    archiveButton: {
        backgroundColor: 'orange',
        justifyContent: 'center',
        alignItems: 'flex-start',
        borderRadius: 8,
        marginBottom: 2,
        width: 70,
    },
    actionContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CredentialCard;
