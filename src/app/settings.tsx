import { ThemedView } from '@/components/ThemedView';
import { accent } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BiometricService } from '@/services/biometricService';
import RealmDataService from '@/services/realmDataService';
import { Octicons } from '@expo/vector-icons';
import { useRealm } from '@realm/react';
import { getDocumentAsync } from 'expo-document-picker';
import { useNavigation } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const Settings = () => {
    const navigation = useNavigation();
    const realm = useRealm();

    const iconColor = useThemeColor({ light: '#1C1C1E', dark: '#FFFFFF' }, 'text');
    const subtextColor = useThemeColor({ light: '#8E8E93', dark: '#6E6E78' }, 'subtext');
    const surface = useThemeColor({ light: '#FFFFFF', dark: '#1A1A24' }, 'surface');
    const border = useThemeColor({ light: '#E5E5EA', dark: '#2A2A38' }, 'border');
    const inputBg = useThemeColor({ light: '#F2F2F7', dark: '#0F0F14' }, 'background');

    // Biometric
    const [biometricSupported, setBiometricSupported] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    useEffect(() => {
        const load = async () => {
            const supported = await BiometricService.isSupported();
            const enabled = await BiometricService.isEnabled();
            setBiometricSupported(supported);
            setBiometricEnabled(enabled);
        };
        load();
    }, []);

    const handleBiometricToggle = async (value: boolean) => {
        if (value) {
            const ok = await BiometricService.authenticate();
            if (!ok) { Alert.alert('Authentication Failed', 'Could not enable biometric lock.'); return; }
        }
        await BiometricService.setEnabled(value);
        setBiometricEnabled(value);
    };

    // Export
    const [exportFileName, setExportFileName] = useState('');
    const [exportPassword, setExportPassword] = useState('');
    const [exportConfirm, setExportConfirm] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!exportPassword) { Alert.alert('Error', 'Please enter an encryption password.'); return; }
        if (exportPassword !== exportConfirm) { Alert.alert('Error', 'Passwords do not match.'); return; }
        if (exportPassword.length < 8) { Alert.alert('Weak Password', 'Use at least 8 characters.'); return; }
        setIsExporting(true);
        try {
            const fileUri = await RealmDataService.exportData(realm, exportPassword, exportFileName || undefined);
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, { dialogTitle: 'Share Encrypted Backup', mimeType: 'application/octet-stream', UTI: 'public.data' });
            } else {
                Alert.alert('Export Complete', `File saved to:\n${fileUri}`);
            }
        } catch {
            Alert.alert('Export Failed', 'An error occurred during export.');
        } finally {
            setIsExporting(false);
        }
    };

    // Import
    const [importPassword, setImportPassword] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async () => {
        if (!importPassword) { Alert.alert('Error', 'Please enter the backup password.'); return; }
        try {
            const result = await getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
            if (result.canceled) return;
            if (result.assets?.length > 0) {
                setIsImporting(true);
                try {
                    await RealmDataService.importData(realm, result.assets[0].uri, importPassword);
                    Alert.alert('Import Complete', 'Credentials imported successfully.');
                    setImportPassword('');
                } catch (e: any) {
                    Alert.alert('Import Failed', e?.message ?? 'Wrong password or corrupted file.');
                } finally {
                    setIsImporting(false);
                }
            }
        } catch {
            Alert.alert('Error', 'Failed to open file picker.');
        }
    };

    const inputStyle = [styles.input, { backgroundColor: inputBg, color: iconColor, borderColor: border }];

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Octicons size={22} name="chevron-left" color={iconColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: iconColor }]}>Settings</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* Security */}
                    <Text style={[styles.sectionHeader, { color: subtextColor }]}>Security</Text>
                    <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.rowIcon, { backgroundColor: accent + '20' }]}>
                                    <Octicons name="shield-lock" size={16} color={accent} />
                                </View>
                                <View>
                                    <Text style={[styles.rowLabel, { color: iconColor }]}>Biometric Lock</Text>
                                    {!biometricSupported && (
                                        <Text style={[styles.rowHint, { color: subtextColor }]}>Not available on this device</Text>
                                    )}
                                </View>
                            </View>
                            <Switch
                                value={biometricEnabled}
                                onValueChange={handleBiometricToggle}
                                disabled={!biometricSupported}
                                trackColor={{ true: accent }}
                            />
                        </View>
                    </View>

                    {/* Export */}
                    <Text style={[styles.sectionHeader, { color: subtextColor }]}>Export Backup</Text>
                    <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
                        <Text style={[styles.cardHint, { color: subtextColor }]}>
                            Creates an AES-256 encrypted .mvault file you can share or store safely.
                        </Text>

                        <Text style={[styles.fieldLabel, { color: subtextColor }]}>File name (optional)</Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="e.g. my-vault-backup"
                            placeholderTextColor={subtextColor}
                            value={exportFileName}
                            onChangeText={setExportFileName}
                            autoCapitalize="none"
                        />

                        <Text style={[styles.fieldLabel, { color: subtextColor }]}>Encryption password</Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="Min. 8 characters"
                            placeholderTextColor={subtextColor}
                            secureTextEntry
                            value={exportPassword}
                            onChangeText={setExportPassword}
                        />

                        <Text style={[styles.fieldLabel, { color: subtextColor }]}>Confirm password</Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="Repeat password"
                            placeholderTextColor={subtextColor}
                            secureTextEntry
                            value={exportConfirm}
                            onChangeText={setExportConfirm}
                        />

                        {isExporting ? (
                            <View style={styles.progressRow}>
                                <ActivityIndicator size="small" color={accent} />
                                <Text style={[styles.progressText, { color: subtextColor }]}>Deriving key…</Text>
                            </View>
                        ) : (
                            <TouchableOpacity style={[styles.btn, { backgroundColor: accent }]} onPress={handleExport}>
                                <Octicons name="upload" size={16} color="#fff" />
                                <Text style={styles.btnText}>Export</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Import */}
                    <Text style={[styles.sectionHeader, { color: subtextColor }]}>Import Backup</Text>
                    <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
                        <Text style={[styles.cardHint, { color: subtextColor }]}>
                            Restores credentials from a .mvault file. Existing data is kept.
                        </Text>

                        <Text style={[styles.fieldLabel, { color: subtextColor }]}>Backup password</Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="Password used when exporting"
                            placeholderTextColor={subtextColor}
                            secureTextEntry
                            value={importPassword}
                            onChangeText={setImportPassword}
                        />

                        {isImporting ? (
                            <View style={styles.progressRow}>
                                <ActivityIndicator size="small" color={accent} />
                                <Text style={[styles.progressText, { color: subtextColor }]}>Verifying and decrypting…</Text>
                            </View>
                        ) : (
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#10B981' }]} onPress={handleImport}>
                                <Octicons name="download" size={16} color="#fff" />
                                <Text style={styles.btnText}>Choose File & Import</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, marginBottom: 4 },
    backBtn: { padding: 6 },
    headerTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },

    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 60, gap: 6 },

    sectionHeader: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 16,
        marginBottom: 6,
        paddingHorizontal: 4,
    },

    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        gap: 10,
    },
    cardHint: { fontSize: 13, lineHeight: 18 },

    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    rowLabel: { fontSize: 15, fontWeight: '500' },
    rowHint: { fontSize: 12, marginTop: 2 },

    fieldLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: -4 },
    input: {
        height: 44,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 15,
    },

    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 4,
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
    progressText: { fontSize: 13 },
});

export default Settings;
