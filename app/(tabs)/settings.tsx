import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, Alert, Share,
} from 'react-native';
import { TIER_CONFIG, COLORS } from '../../constants/theme';
import { loadContacts, saveContacts, loadSettings, saveSettings, exportData, AppSettings } from '../../utils/storage';
import { previewWeeklyDigest, previewBirthdayReminders, previewAllNotifications, checkAndSendNotifications } from '../../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    quietHoursStart: 22,
    quietHoursEnd: 8,
    enabledTiers: [1, 2, 3, 4, 5],
  });

  useEffect(() => {
    (async () => {
      const saved = await loadSettings();
      setSettings(saved);
    })();
  }, []);

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings(updated);
  };

  const toggleTierNotification = async (tier: number) => {
    const current = settings.enabledTiers;
    const updated = current.includes(tier)
      ? current.filter(t => t !== tier)
      : [...current, tier];
    await updateSetting('enabledTiers', updated);
  };

  const handleExport = async () => {
    try {
      const contacts = await loadContacts();
      if (!contacts || contacts.length === 0) {
        Alert.alert('No Data', 'No contacts to export.');
        return;
      }
      const json = await exportData(contacts);
      await Share.share({
        message: json,
        title: 'Inner Circle Backup',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your contacts and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Done', 'All data has been reset. Restart the app to see changes.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Notifications */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Reminders</Text>
            <Text style={styles.settingDesc}>Get notified when you&apos;re overdue</Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSetting('notificationsEnabled', v)}
            trackColor={{ false: '#333', true: COLORS.accent + '80' }}
            thumbColor={settings.notificationsEnabled ? COLORS.accent : '#666'}
          />
        </View>
      </View>

      {/* Tier Notifications */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>NOTIFY FOR TIERS</Text>
      </View>

      <View style={styles.card}>
        {[1, 2, 3, 4, 5].map(tier => (
          <View key={tier} style={[styles.settingRow, tier < 5 && styles.settingRowBorder]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: TIER_CONFIG[tier].color }]}>
                {TIER_CONFIG[tier].emoji} Tier {tier}: {TIER_CONFIG[tier].label}
              </Text>
              <Text style={styles.settingDesc}>Every {TIER_CONFIG[tier].maxDays} days</Text>
            </View>
            <Switch
              value={settings.enabledTiers.includes(tier)}
              onValueChange={() => toggleTierNotification(tier)}
              trackColor={{ false: '#333', true: TIER_CONFIG[tier].color + '80' }}
              thumbColor={settings.enabledTiers.includes(tier) ? TIER_CONFIG[tier].color : '#666'}
            />
          </View>
        ))}
      </View>

      {/* Test Notifications */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TEST NOTIFICATIONS</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.actionRow} onPress={async () => {
          try {
            await checkAndSendNotifications();
            Alert.alert('Sent!', 'If your device supports notifications, check your notification tray. Otherwise use "Preview All" below to see them in-app.');
          } catch (e) {
            Alert.alert('Note', 'System notifications may not work on this emulator. Use "Preview All" below to test notification content.');
          }
        }}>
          <Text style={styles.actionLabel}>🔔 Send Test Reminder</Text>
          <Text style={styles.actionHint}>Attempts to send a real system notification</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionRow} onPress={async () => {
          const contacts = await loadContacts();
          if (!contacts || contacts.length === 0) { Alert.alert('No contacts'); return; }
          const all = previewAllNotifications(contacts);
          if (all.length === 0) {
            Alert.alert('No Notifications', 'None of your contacts are overdue enough to trigger notifications yet.');
            return;
          }
          const text = all.map((n, i) => `━━━ ${n.type.toUpperCase()} ━━━\n${n.title}\n${n.body}`).join('\n\n');
          Alert.alert(`📱 ${all.length} Notification${all.length > 1 ? 's' : ''} Would Fire`, text);
        }}>
          <Text style={styles.actionLabel}>📱 Preview All Notifications</Text>
          <Text style={styles.actionHint}>Shows every notification that would fire right now, in-app</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionRow} onPress={async () => {
          const contacts = await loadContacts();
          if (!contacts) { Alert.alert('No contacts'); return; }
          const digest = previewWeeklyDigest(contacts);
          if (digest) {
            Alert.alert(digest.title, digest.body);
          }
        }}>
          <Text style={styles.actionLabel}>📋 Preview Weekly Digest</Text>
          <Text style={styles.actionHint}>See what your Monday morning report looks like</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionRow} onPress={async () => {
          const contacts = await loadContacts();
          if (!contacts) { Alert.alert('No contacts'); return; }
          const reminders = previewBirthdayReminders(contacts);
          if (reminders.length === 0) {
            Alert.alert('🎂 No Upcoming Birthdays', 'No contacts have birthdays within the next 14 days.');
          } else {
            const text = reminders.map(r => `${r.title}\n${r.body}`).join('\n\n');
            Alert.alert(`🎂 ${reminders.length} Upcoming Birthday${reminders.length > 1 ? 's' : ''}`, text);
          }
        }}>
          <Text style={styles.actionLabel}>🎂 Preview Birthday Reminders</Text>
          <Text style={styles.actionHint}>See upcoming birthdays within 14 days</Text>
        </TouchableOpacity>
      </View>

      {/* Data */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>DATA</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.actionRow} onPress={handleExport}>
          <Text style={styles.actionLabel}>📤 Export Contacts</Text>
          <Text style={styles.actionHint}>Share as JSON backup</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionRow} onPress={handleReset}>
          <Text style={[styles.actionLabel, { color: COLORS.danger }]}>🗑️ Reset All Data</Text>
          <Text style={styles.actionHint}>Delete all contacts and settings</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Inner Circle</Text>
          <Text style={styles.aboutValue}>v1.0.0</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Built with</Text>
          <Text style={styles.aboutValue}>React Native + Expo</Text>
        </View>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 12, color: COLORS.textMuted, letterSpacing: 1 },
  card: {
    marginHorizontal: 16, backgroundColor: COLORS.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden',
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  settingDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  actionRow: { padding: 16 },
  actionLabel: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  actionHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  aboutLabel: { fontSize: 15, color: COLORS.text },
  aboutValue: { fontSize: 15, color: COLORS.textMuted },
});
