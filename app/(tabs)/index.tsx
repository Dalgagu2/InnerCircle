import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AddContactModal from '../../components/AddContactModal';
import CalendarSyncModal from '../../components/CalendarSyncModal';
import ContactCard from '../../components/ContactCard';
import ContactDetailModal from '../../components/ContactDetailModal';
import Icon, { tierIconName } from '../../components/Icon';
import ImportContactsModal from '../../components/ImportContactsModal';
import { TIER_CONFIG, tierTextColor, useColors, useColorSchemeName } from '../../constants/theme';
import { FONTS } from '../../constants/fonts';
import { Contact } from '../../constants/types';
import { checkAndSendNotifications, requestNotificationPermission, scheduleAllNotifications } from '../../utils/notifications';
import { loadContacts, saveContacts } from '../../utils/storage';
import { daysSince, sortByUrgency } from '../../utils/time';

const SAMPLE_CONTACTS: Contact[] = [
  { id: '1', name: 'Alex Rivera', tier: 1, lastInteraction: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], interactionType: 'Coffee/Meal', history: [], notes: '', birthday: '03/15', hobbies: 'Hiking, board games', knowFrom: 'College roommate' },
  { id: '2', name: 'Sam Chen', tier: 2, lastInteraction: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], interactionType: 'Call', history: [], notes: '', birthday: '07/22', hobbies: 'Cooking, photography', knowFrom: 'Work' },
  { id: '3', name: 'Jordan Lee', tier: 1, lastInteraction: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], interactionType: 'Text/Chat', history: [], notes: '', birthday: '11/05', hobbies: 'Gaming, movies', knowFrom: 'High school' },
  { id: '4', name: 'Morgan Park', tier: 3, lastInteraction: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0], interactionType: 'Hangout', history: [], notes: '', birthday: '', hobbies: 'Running', knowFrom: 'Gym' },
  { id: '5', name: 'Taylor Kim', tier: 4, lastInteraction: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0], interactionType: 'Email', history: [], notes: '', birthday: '01/30', hobbies: '', knowFrom: 'Conference' },
  { id: '6', name: 'Casey Nguyen', tier: 5, lastInteraction: new Date(Date.now() - 100 * 86400000).toISOString().split('T')[0], interactionType: 'Other', history: [], notes: '', birthday: '', hobbies: '', knowFrom: 'Friend of a friend' },
];

export default function HomeScreen() {
  const colors = useColors();
  const scheme = useColorSchemeName();
  const styles = makeStyles(colors);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filterTier, setFilterTier] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'dashboard' | 'tiers'>('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  // Load data on mount
  useEffect(() => {
    (async () => {
      const saved = await loadContacts();
      setContacts(saved || SAMPLE_CONTACTS);
      setLoading(false);

      // Setup notifications
      const granted = await requestNotificationPermission();
      setNotificationsGranted(granted);
      if (granted) {
        await scheduleAllNotifications();
        await checkAndSendNotifications();
      }
    })();
  }, []);

  // Save whenever contacts change
  useEffect(() => {
    if (!loading && contacts.length >= 0) {
      saveContacts(contacts);
    }
  }, [contacts, loading]);

  // Keep scheduled reminders in sync with the latest contact data
  // (logging an interaction, changing tiers, etc. all affect who's overdue)
  useEffect(() => {
    if (!loading && notificationsGranted) {
      scheduleAllNotifications();
    }
  }, [contacts, loading, notificationsGranted]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Contact operations
  const addContact = (contact: Contact) => {
    setContacts(prev => [...prev, contact]);
    setShowAdd(false);
  };

  const importContacts = (newContacts: Contact[]) => {
    setContacts(prev => [...prev, ...newContacts]);
  };

  const applyCalendarSync = (updatedContacts: Contact[]) => {
    setContacts(updatedContacts);
  };

  const logInteraction = (contactId: string, type: string, date: string) => {
    setContacts(prev => prev.map(c => {
      if (c.id !== contactId) return c;
      return {
        ...c,
        lastInteraction: date,
        interactionType: type,
        history: [{ date, type }, ...(c.history || [])].slice(0, 50),
      };
    }));
    // Update selected contact to reflect changes
    setSelectedContact(prev => {
      if (!prev || prev.id !== contactId) return prev;
      return {
        ...prev,
        lastInteraction: date,
        interactionType: type,
        history: [{ date, type }, ...(prev.history || [])].slice(0, 50),
      };
    });
  };

  const updateTier = (contactId: string, tier: number) => {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, tier } : c));
    setSelectedContact(prev => prev && prev.id === contactId ? { ...prev, tier } : prev);
  };

  const updateField = (contactId: string, field: string, value: string) => {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, [field]: value } : c));
    setSelectedContact(prev => prev && prev.id === contactId ? { ...prev, [field]: value } : prev);
  };

  const deleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
    setSelectedContact(null);
  };

  // Filtered and sorted contacts
  const filtered = contacts
    .filter(c => filterTier === 0 || c.tier === filterTier)
    .filter(c => searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const sorted = sortByUrgency(filtered);

  // Stats
  const overdueCount = contacts.filter(c => {
    const days = daysSince(c.lastInteraction);
    return days >= (TIER_CONFIG[c.tier]?.maxDays || 30);
  }).length;

  const criticalCount = contacts.filter(c => {
    const days = daysSince(c.lastInteraction);
    return days >= (TIER_CONFIG[c.tier]?.maxDays || 30) * 1.5;
  }).length;

  if (loading) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textMuted, fontSize: 16, fontFamily: FONTS.body }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Inner Circle</Text>
          <Text style={styles.subtitle}>FRIENDSHIP TRACKER</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'TOTAL', value: contacts.length, color: colors.text },
            { label: 'OVERDUE', value: overdueCount, color: colors.overdue },
            { label: 'CRITICAL', value: criticalCount, color: colors.danger },
          ].map((s, i) => (
            <View key={i} style={styles.statBox}>
              <Text style={[styles.statNumber, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={colors.textDark}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
              <Icon name="close" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* View toggle */}
        <View style={styles.navRow}>
          {(['dashboard', 'tiers'] as const).map(v => (
            <TouchableOpacity
              key={v}
              onPress={() => setView(v)}
              style={[styles.navBtn, view === v && styles.navBtnActive]}
            >
              <Text style={[styles.navBtnText, view === v && styles.navBtnTextActive]}>
                {v === 'dashboard' ? 'Dashboard' : 'By Tier'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setShowImport(true)} style={styles.iconNavBtn}>
            <Icon name="phone" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCalendarSync(true)} style={styles.iconNavBtn}>
            <Icon name="calendar" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
            <Icon name="plus" size={15} color="#fff" strokeWidth={2.5} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Tier filters (dashboard only) */}
        {view === 'dashboard' && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              onPress={() => setFilterTier(0)}
              style={[styles.filterChip, filterTier === 0 && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filterTier === 0 && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {[1, 2, 3, 4, 5].map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setFilterTier(t)}
                style={[
                  styles.filterChip,
                  filterTier === t && { backgroundColor: TIER_CONFIG[t].bg, borderColor: TIER_CONFIG[t].border },
                ]}
              >
                <Icon name={tierIconName(t)} size={11} color={filterTier === t ? tierTextColor(t, scheme) : colors.textMuted} />
                <Text style={[styles.filterChipText, filterTier === t && { color: tierTextColor(t, scheme) }]}>
                  T{t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Dashboard view */}
        {view === 'dashboard' && (
          <View style={styles.section}>
            {sorted.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name={searchQuery ? 'search' : 'wave'} size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No matches found' : 'No contacts yet'}
                </Text>
                <Text style={styles.emptyHint}>
                  {searchQuery ? 'Try a different search' : 'Tap Add to get started'}
                </Text>
              </View>
            ) : (
              sorted.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onPress={() => setSelectedContact(contact)}
                  onLongPress={() => deleteContact(contact.id)}
                />
              ))
            )}
          </View>
        )}

        {/* Tiers view */}
        {view === 'tiers' && (
          <View style={styles.section}>
            {[1, 2, 3, 4, 5].map(tier => {
              const config = TIER_CONFIG[tier];
              const tierContacts = sortByUrgency(
                contacts.filter(c => c.tier === tier)
                  .filter(c => searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
              );
              return (
                <View key={tier} style={styles.tierGroup}>
                  <View style={[styles.tierHeader, { backgroundColor: config.bg, borderColor: config.border }]}>
                    <Icon name={tierIconName(tier)} size={18} color={tierTextColor(tier, scheme)} />
                    <View>
                      <Text style={[styles.tierHeaderTitle, { color: tierTextColor(tier, scheme) }]}>
                        Tier {tier} — {config.label}
                      </Text>
                      <Text style={styles.tierHeaderSub}>
                        Every {config.maxDays}d · {tierContacts.length} {tierContacts.length === 1 ? 'person' : 'people'}
                      </Text>
                    </View>
                  </View>
                  {tierContacts.length === 0 ? (
                    <Text style={styles.tierEmpty}>No contacts in this tier</Text>
                  ) : (
                    tierContacts.map(contact => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        onPress={() => setSelectedContact(contact)}
                        onLongPress={() => deleteContact(contact.id)}
                      />
                    ))
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <AddContactModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addContact}
      />

      <ImportContactsModal
        visible={showImport}
        onClose={() => setShowImport(false)}
        onImport={importContacts}
        existingNames={contacts.map(c => c.name)}
      />

      <CalendarSyncModal
        visible={showCalendarSync}
        onClose={() => setShowCalendarSync(false)}
        contacts={contacts}
        onApply={applyCalendarSync}
      />

      <ContactDetailModal
        contact={selectedContact}
        visible={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onLogInteraction={logInteraction}
        onUpdateTier={updateTier}
        onUpdateField={updateField}
        onDelete={deleteContact}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 60, paddingBottom: 20, alignItems: 'center' },
  title: { fontSize: 30, fontFamily: FONTS.displayBold, color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: colors.textMuted, letterSpacing: 2.5, marginTop: 6 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 18 },
  statBox: {
    flex: 1, backgroundColor: colors.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: colors.cardBorder, padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 2,
  },
  statNumber: { fontSize: 24, fontFamily: FONTS.displayBold },
  statLabel: { fontSize: 10, fontFamily: FONTS.bodyMedium, color: colors.textMuted, letterSpacing: 1.2, marginTop: 3 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 14,
    backgroundColor: colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 14, fontFamily: FONTS.body, color: colors.text },
  clearSearch: { padding: 4 },
  navRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 6, marginBottom: 14, alignItems: 'center' },
  navBtn: { flex: 1, padding: 9, borderRadius: 11, alignItems: 'center' },
  navBtnActive: { backgroundColor: colors.cardBorder },
  navBtnText: { fontSize: 13, fontFamily: FONTS.bodySemiBold, color: colors.textMuted },
  navBtnTextActive: { color: colors.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 11, backgroundColor: colors.accent,
  },
  addBtnText: { fontSize: 13, fontFamily: FONTS.bodySemiBold, color: '#fff' },
  iconNavBtn: {
    width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.cardBg,
  },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 6, marginBottom: 18, flexWrap: 'wrap' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: 13, borderRadius: 20,
    backgroundColor: colors.cardBg, borderWidth: 1, borderColor: 'transparent',
  },
  filterChipActive: { backgroundColor: colors.cardBorder },
  filterChipText: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: colors.textMuted },
  filterChipTextActive: { color: colors.text },
  section: { paddingHorizontal: 20 },
  emptyState: {
    alignItems: 'center', padding: 40, gap: 12, backgroundColor: colors.cardBg,
    borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder,
  },
  emptyText: { fontSize: 16, fontFamily: FONTS.bodySemiBold, color: colors.text },
  emptyHint: { fontSize: 13, fontFamily: FONTS.body, color: colors.textMuted, marginTop: -6 },
  tierGroup: { marginBottom: 22 },
  tierHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    padding: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1,
  },
  tierHeaderTitle: { fontSize: 14, fontFamily: FONTS.bodySemiBold },
  tierHeaderSub: { fontSize: 11, fontFamily: FONTS.body, color: colors.textMuted, marginTop: 1 },
  tierEmpty: { padding: 12, fontSize: 13, fontFamily: FONTS.body, color: colors.textDark, fontStyle: 'italic', paddingLeft: 8 },
});
