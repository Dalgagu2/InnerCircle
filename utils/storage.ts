import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../constants/types';

const CONTACTS_KEY = 'inner_circle_contacts';
const SETTINGS_KEY = 'inner_circle_settings';
const ONBOARDED_KEY = 'inner_circle_onboarded';

export async function saveContacts(contacts: Contact[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch (error) {
    console.error('Error saving contacts:', error);
  }
}

export async function loadContacts(): Promise<Contact[] | null> {
  try {
    const data = await AsyncStorage.getItem(CONTACTS_KEY);
    if (!data) return null;
    const parsed: Contact[] = JSON.parse(data);
    // Contacts saved before a field existed (e.g. zipCode) won't have that key at all,
    // so backfill defaults for anything added to the schema after contacts were first saved.
    return parsed.map(c => ({ ...c, zipCode: c.zipCode || '' }));
  } catch (error) {
    console.error('Error loading contacts:', error);
    return null;
  }
}

export interface AppSettings {
  notificationsEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  enabledTiers: number[];
}

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  enabledTiers: [1, 2, 3, 4, 5],
};

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function setOnboarded(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
  } catch (error) {
    console.error('Error setting onboarded:', error);
  }
}

export async function hasOnboarded(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(ONBOARDED_KEY);
    return data === 'true';
  } catch (error) {
    return false;
  }
}

export async function exportData(contacts: Contact[]): Promise<string> {
  return JSON.stringify({ contacts, exportedAt: new Date().toISOString(), version: 1 });
}

export async function importData(jsonString: string): Promise<Contact[] | null> {
  try {
    const data = JSON.parse(jsonString);
    if (data.contacts && Array.isArray(data.contacts)) {
      return data.contacts;
    }
    return null;
  } catch (error) {
    console.error('Error importing data:', error);
    return null;
  }
}
