/**
 * RealmDataService — secure export / import for YouVault
 *
 * Format v2 security properties:
 *  - Key derivation : PBKDF2-SHA256, 50 000 iterations, 256-bit salt
 *  - Encryption     : AES-256-CBC
 *  - Authentication : HMAC-SHA256 (Encrypt-then-MAC over v|salt|iv|ct)
 *  - Two independent 256-bit keys derived in one PBKDF2 call (enc + mac)
 *  - All random material generated via expo-crypto (native CSPRNG)
 */

import Realm, { BSON } from 'realm';
import CryptoJS from 'crypto-js';
import * as FileSystem from 'expo-file-system/legacy';
import { Credential } from '@/models/Credential';
import { Tag } from '@/models/Tag';
import { getRandomBytesAsync } from 'expo-crypto';

const FORMAT_VERSION = 2;
const PBKDF2_ITERATIONS = 50_000;
const SALT_BYTES = 32;
const IV_BYTES = 16;

interface EncryptedPackage {
  v: number;
  salt: string;
  iv: string;
  ct: string;
  mac: string;
  exportedAt: string;
}

async function randomHex(bytes: number): Promise<string> {
  const arr = await getRandomBytesAsync(bytes);
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveKeys(
  password: string,
  saltHex: string,
): Promise<{ encKey: CryptoJS.lib.WordArray; macKey: CryptoJS.lib.WordArray }> {
  const salt = CryptoJS.enc.Hex.parse(saltHex);
  const derived = CryptoJS.PBKDF2(password, salt, {
    keySize: 512 / 32,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  const hex = derived.toString(CryptoJS.enc.Hex);
  return {
    encKey: CryptoJS.enc.Hex.parse(hex.slice(0, 64)),
    macKey: CryptoJS.enc.Hex.parse(hex.slice(64, 128)),
  };
}

function macInput(v: number, salt: string, iv: string, ct: string): string {
  return `${v}|${salt}|${iv}|${ct}`;
}

function realmObjectToPlain(obj: any): any {
  const plain: any = {};
  const schema = obj.objectSchema().properties;
  Object.keys(schema).forEach(prop => {
    if (prop === '_id') {
      plain[prop] = obj[prop].toHexString();
    } else if (obj[prop] instanceof Date) {
      plain[prop] = obj[prop].toISOString();
    } else if (schema[prop].type === 'list') {
      plain[prop] = Array.from(obj[prop]).map((item: any) => item._id.toHexString());
    } else {
      plain[prop] = obj[prop];
    }
  });
  return plain;
}

class RealmDataService {
  static async exportData(realm: Realm, password: string, fileName?: string): Promise<string> {
    const payload = JSON.stringify({
      credentials: Array.from(realm.objects<Credential>('Credential')).map(realmObjectToPlain),
      tags: Array.from(realm.objects<Tag>('Tag')).map(realmObjectToPlain),
    });

    const saltHex = await randomHex(SALT_BYTES);
    const ivHex   = await randomHex(IV_BYTES);
    const { encKey, macKey } = await deriveKeys(password, saltHex);

    const iv        = CryptoJS.enc.Hex.parse(ivHex);
    const encrypted = CryptoJS.AES.encrypt(payload, encKey, {
      iv,
      mode:    CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const ct = encrypted.toString();

    const mac = CryptoJS.HmacSHA256(
      macInput(FORMAT_VERSION, saltHex, ivHex, ct),
      macKey,
    ).toString(CryptoJS.enc.Hex);

    const pkg: EncryptedPackage = {
      v:          FORMAT_VERSION,
      salt:       saltHex,
      iv:         ivHex,
      ct,
      mac,
      exportedAt: new Date().toISOString(),
    };

    const date     = new Date().toISOString().split('T')[0];
    const name     = fileName?.trim() || `youvault_${date}`;
    const fileUri  = `${FileSystem.documentDirectory}${name}.mvault`;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(pkg), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return fileUri;
  }

  static async importData(realm: Realm, fileUri: string, password: string): Promise<void> {
    const raw = await FileSystem.readAsStringAsync(fileUri);
    let pkg: EncryptedPackage;
    try {
      pkg = JSON.parse(raw);
    } catch {
      throw new Error('The file is not a valid YouVault backup.');
    }

    if (pkg.v !== FORMAT_VERSION) {
      throw new Error(
        `Unsupported backup format (v${pkg.v}). Please use the latest version of YouVault.`,
      );
    }

    const { encKey, macKey } = await deriveKeys(password, pkg.salt);

    const expectedMac = CryptoJS.HmacSHA256(
      macInput(FORMAT_VERSION, pkg.salt, pkg.iv, pkg.ct),
      macKey,
    ).toString(CryptoJS.enc.Hex);

    if (expectedMac !== pkg.mac) {
      throw new Error('Wrong password or corrupted backup file.');
    }

    const iv        = CryptoJS.enc.Hex.parse(pkg.iv);
    const decrypted = CryptoJS.AES.decrypt(pkg.ct, encKey, {
      iv,
      mode:    CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const payload = decrypted.toString(CryptoJS.enc.Utf8);

    if (!payload) {
      throw new Error('Decryption produced no output — the file may be corrupted.');
    }

    let data: { credentials: any[]; tags: any[] };
    try {
      data = JSON.parse(payload);
    } catch {
      throw new Error('Decrypted data is malformed.');
    }

    realm.write(() => {
      const tagMap = new Map<string, Tag>();

      data.tags.forEach((tagData: any) => {
        const tag = realm.create<Tag>('Tag', {
          _id:      new BSON.ObjectId(tagData._id),
          name:     tagData.name,
          colorHex: tagData.colorHex,
          iconName: tagData.iconName,
        });
        tagMap.set(tagData._id, tag);
      });

      data.credentials.forEach((credData: any) => {
        const credential = realm.create<Credential>('Credential', {
          _id:        new BSON.ObjectId(credData._id),
          title:      credData.title,
          username:   credData.username,
          password:   credData.password,
          url:        credData.url,
          notes:      credData.notes,
          createdAt:  new Date(credData.createdAt),
          updatedAt:  new Date(credData.updatedAt),
          isFavorite: credData.isFavorite,
          isArchived: credData.isArchived,
        });

        if (credData.tags?.length > 0) {
          credData.tags.forEach((tagId: string) => {
            tagMap.get(tagId)?.credentials.push(credential);
          });
        }
      });
    });
  }
}

export default RealmDataService;
