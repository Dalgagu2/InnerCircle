import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, ActivityIndicator, Alert, TextInput, Platform,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { TIER_CONFIG, COLORS } from '../constants/theme';
import { Contact } from '../constants/types';

interface PhoneContact {
  id: string;
  name: string;
  birthday: string;
  company: string;
}

interface ImportContactsModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (contacts: Contact[]) => void;
  existingNames: string[];
}

type Mode = 'choose' | 'pick' | 'bulk';

export default function ImportContactsModal({ visible, onClose, onImport, existingNames }: ImportContactsModalProps) {
  const [mode, setMode] = useState<Mode>('choose');
  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tier, setTier] = useState(3);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sessionImportedNames, setSessionImportedNames] = useState<string[]>([]);
  const [pickedContact, setPickedContact] = useState<PhoneContact | null>(null);

  useEffect(() => {
    if (visible) {
      setMode('choose');
      setSelected(new Set());
      setTier(3);
      setSearchQuery('');
      setPhoneContacts([]);
      setSuccessMessage('');
      setSessionImportedNames([]);
      setPickedContact(null);
    }
  }, [visible]);

  // ─── Single Pick Mode ────────────────────────────────────────────────

  const pickSingleContact = async () => {
    try {
      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return; // user cancelled

      // Build name from whatever fields are available
      const name = contact.name
        || [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(' ')
        || '';
      if (!name.trim()) {
        Alert.alert('No Name', 'This contact has no name set. Please pick another.');
        return;
      }

      // Check if already exists
      const allExisting = [...existingNames, ...sessionImportedNames].map(n => n.toLowerCase());
      if (allExisting.includes(name.toLowerCase())) {
        Alert.alert('Already Added', `${name} is already in your contacts.`);
        return;
      }

      // Parse birthday from contact data
      let birthday = '';
      if (contact.birthday) {
        const month = contact.birthday.month !== undefined ? String(contact.birthday.month + 1).padStart(2, '0') : '';
        const day = contact.birthday.day !== undefined ? String(contact.birthday.day).padStart(2, '0') : '';
        const year = contact.birthday.year ? String(contact.birthday.year) : '';
        if (month && day) {
          birthday = year ? `${month}/${day}/${year}` : `${month}/${day}`;
        }
      }

      // Get company
      const company = contact.company || contact.department || '';

      setPickedContact({
        id: contact.id || Date.now().toString(),
        name: name.trim(),
        birthday,
        company,
      });
      setMode('pick');
    } catch (error: any) {
      // presentContactPickerAsync may not be available in Expo Go
      // Fall back to requesting permissions and using getContactsAsync
      console.log('Contact picker error, falling back to permission-based flow:', error?.message || error);
      Alert.alert(
        'Picker Not Available',
        'The single contact picker is not available in Expo Go. Please use Bulk Import instead, or create a development build.',
        [
          { text: 'Use Bulk Import', onPress: () => startBulkImport() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const confirmPickedContact = () => {
    if (!pickedContact) return;

    const newContact: Contact = {
      id: 'imp_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      name: pickedContact.name,
      tier,
      lastInteraction: null,
      interactionType: null,
      history: [],
      birthday: pickedContact.birthday,
      hobbies: '',
      knowFrom: pickedContact.company,
      notes: '',
    };

    onImport([newContact]);
    setSessionImportedNames(prev => [...prev, pickedContact.name]);
    setSuccessMessage(`✅ Added ${pickedContact.name}!`);
    setPickedContact(null);
    setMode('choose');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // ─── Bulk Import Mode ────────────────────────────────────────────────

  const startBulkImport = async () => {
    setMode('bulk');
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Full Access Required',
          'Bulk import needs full contact access. You can use "Pick One at a Time" instead, which works without permissions.',
          [{ text: 'OK', onPress: () => setMode('choose') }]
        );
        setLoading(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.Birthday,
          Contacts.Fields.Company,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      const parsed: PhoneContact[] = data
        .filter(c => c.name && c.name.trim().length > 0)
        .map(c => {
          let birthday = '';
          if (c.birthday) {
            const month = c.birthday.month !== undefined ? String(c.birthday.month + 1).padStart(2, '0') : '';
            const day = c.birthday.day !== undefined ? String(c.birthday.day).padStart(2, '0') : '';
            const year = c.birthday.year ? String(c.birthday.year) : '';
            if (month && day) {
              birthday = year ? `${month}/${day}/${year}` : `${month}/${day}`;
            }
          }
          return {
            id: c.id || Date.now().toString() + Math.random().toString(),
            name: c.name || '',
            birthday,
            company: c.company || '',
          };
        });

      setPhoneContacts(parsed);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts.');
      setMode('choose');
    }
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    selected.size === filtered.length
      ? setSelected(new Set())
      : setSelected(new Set(filtered.map(c => c.id)));
  };

  const handleBulkImport = () => {
    const toImport = phoneContacts.filter(c => selected.has(c.id));
    if (toImport.length === 0) return;
    const count = toImport.length;
    const importedNames = toImport.map(c => c.name);

    const newContacts: Contact[] = toImport.map(c => ({
      id: 'imp_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      name: c.name,
      tier,
      lastInteraction: null,
      interactionType: null,
      history: [],
      birthday: c.birthday,
      hobbies: '',
      knowFrom: c.company,
      notes: '',
    }));

    onImport(newContacts);
    setSessionImportedNames(prev => [...prev, ...importedNames]);
    setSelected(new Set());
    setSuccessMessage(`✅ Imported ${count} ${count === 1 ? 'contact' : 'contacts'}!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Filtered list for bulk mode
  const allExisting = [...existingNames, ...sessionImportedNames].map(n => n.toLowerCase());
  const filtered = phoneContacts
    .filter(c => !allExisting.includes(c.name.toLowerCase()))
    .filter(c => searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const selectedCount = selected.size;

  // ─── Tier Selector (shared) ──────────────────────────────────────────

  const renderTierSelector = () => (
    <View style={styles.tierSection}>
      <Text style={styles.label}>ASSIGN TIER</Text>
      <View style={styles.tierRow}>
        {[1, 2, 3, 4, 5].map(t => {
          const config = TIER_CONFIG[t];
          const isSelected = tier === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTier(t)}
              style={[styles.tierOption, isSelected && { backgroundColor: config.color + '20', borderColor: config.color + '60' }]}
            >
              <Text style={styles.tierEmoji}>{config.emoji}</Text>
              <Text style={[styles.tierNum, isSelected && { color: config.color }]}>T{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.content}>

          <View style={styles.headerRow}>
            <Text style={styles.title}>Import Contacts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeX}>
              <Text style={styles.closeXText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Success banner */}
          {successMessage !== '' && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* ─── Choose Mode ─── */}
          {mode === 'choose' && (
            <View>
              <Text style={styles.modeDesc}>How would you like to import contacts?</Text>

              <TouchableOpacity style={styles.modeCard} onPress={pickSingleContact}>
                <Text style={styles.modeCardEmoji}>👆</Text>
                <View style={styles.modeCardInfo}>
                  <Text style={styles.modeCardTitle}>Pick One at a Time</Text>
                  <Text style={styles.modeCardDesc}>
                    Opens your phone&apos;s contact picker. No permissions needed. Tap again to add another.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modeCard} onPress={startBulkImport}>
                <Text style={styles.modeCardEmoji}>📋</Text>
                <View style={styles.modeCardInfo}>
                  <Text style={styles.modeCardTitle}>Bulk Import</Text>
                  <Text style={styles.modeCardDesc}>
                    Browse all your contacts and select multiple at once. Requires full contact access.
                  </Text>
                </View>
              </TouchableOpacity>

              {sessionImportedNames.length > 0 && (
                <Text style={styles.sessionCount}>
                  {sessionImportedNames.length} {sessionImportedNames.length === 1 ? 'contact' : 'contacts'} added this session
                </Text>
              )}
            </View>
          )}

          {/* ─── Pick Mode (confirm single contact) ─── */}
          {mode === 'pick' && pickedContact && (
            <View>
              <View style={styles.pickedCard}>
                <View style={styles.pickedAvatar}>
                  <Text style={styles.pickedAvatarText}>{pickedContact.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.pickedName}>{pickedContact.name}</Text>
                {pickedContact.birthday ? <Text style={styles.pickedMeta}>🎂 {pickedContact.birthday}</Text> : null}
                {pickedContact.company ? <Text style={styles.pickedMeta}>🏢 {pickedContact.company}</Text> : null}
              </View>

              {renderTierSelector()}

              <View style={styles.bottomButtons}>
                <TouchableOpacity style={styles.backBtn} onPress={() => { setPickedContact(null); setMode('choose'); }}>
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.importBtn} onPress={confirmPickedContact}>
                  <Text style={styles.importBtnText}>Add {pickedContact.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ─── Bulk Mode ─── */}
          {mode === 'bulk' && (
            <>
              {loading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                  <Text style={styles.loadingText}>Reading your contacts...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.searchContainer}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search contacts..."
                      placeholderTextColor={COLORS.textDark}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  <View style={styles.topBar}>
                    <TouchableOpacity onPress={selectAll} style={styles.selectAllBtn}>
                      <Text style={styles.selectAllText}>
                        {selected.size === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.countText}>
                      {filtered.length} available · {selectedCount} selected
                    </Text>
                  </View>

                  <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                    {filtered.length === 0 ? (
                      <View style={styles.centered}>
                        <Text style={styles.emptyEmoji}>
                          {searchQuery ? '🔍' : phoneContacts.length === 0 ? '📵' : '✅'}
                        </Text>
                        <Text style={styles.emptyText}>
                          {searchQuery
                            ? 'No matches'
                            : phoneContacts.length === 0
                            ? 'No contacts found on this device'
                            : 'All contacts imported!'}
                        </Text>
                      </View>
                    ) : (
                      filtered.map(contact => {
                        const isSelected = selected.has(contact.id);
                        return (
                          <TouchableOpacity
                            key={contact.id}
                            onPress={() => toggleSelect(contact.id)}
                            style={[styles.contactRow, isSelected && styles.contactRowSelected]}
                          >
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                              {isSelected && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <View style={styles.contactInfo}>
                              <Text style={styles.contactName}>{contact.name}</Text>
                              <View style={styles.contactMeta}>
                                {contact.birthday ? <Text style={styles.metaTag}>🎂 {contact.birthday}</Text> : null}
                                {contact.company ? <Text style={styles.metaTag}>🏢 {contact.company}</Text> : null}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>

                  {renderTierSelector()}

                  <View style={styles.bottomButtons}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setMode('choose')}>
                      <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.importBtn, selectedCount === 0 && { opacity: 0.35 }]}
                      onPress={handleBulkImport}
                      disabled={selectedCount === 0}
                    >
                      <Text style={styles.importBtnText}>
                        {selectedCount === 0 ? 'Select contacts' : `Import ${selectedCount}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  content: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36, maxHeight: '92%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderBottomWidth: 0,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  closeX: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  closeXText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
  successBanner: {
    padding: 12, borderRadius: 10, marginBottom: 12,
    backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
  },
  successText: { color: '#4ADE80', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  modeDesc: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10,
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modeCardEmoji: { fontSize: 32, marginRight: 14 },
  modeCardInfo: { flex: 1 },
  modeCardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  modeCardDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  sessionCount: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 10 },
  pickedCard: {
    alignItems: 'center', padding: 24, marginBottom: 16, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  pickedAvatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.accent + '20',
    borderWidth: 2, borderColor: COLORS.accent + '50', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  pickedAvatarText: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  pickedName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  pickedMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  tierSection: { marginBottom: 14 },
  label: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, marginBottom: 8 },
  tierRow: { flexDirection: 'row', gap: 6 },
  tierOption: {
    flex: 1, alignItems: 'center', padding: 10, borderRadius: 10,
    borderWidth: 2, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tierEmoji: { fontSize: 16, marginBottom: 2 },
  tierNum: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  bottomButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  backBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: { color: COLORS.textMuted, fontSize: 15, fontWeight: '600' },
  importBtn: { flex: 2, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.accent },
  importBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  centered: { alignItems: 'center', paddingVertical: 30 },
  loadingText: { color: COLORS.textMuted, marginTop: 12, fontSize: 14 },
  searchContainer: { marginBottom: 10 },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 10, fontSize: 14, color: COLORS.text,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  selectAllBtn: { padding: 6 },
  selectAllText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  countText: { color: COLORS.textMuted, fontSize: 12 },
  list: { maxHeight: 220, marginBottom: 10 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 4,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'transparent',
  },
  contactRowSelected: { backgroundColor: 'rgba(232,54,79,0.06)', borderColor: 'rgba(232,54,79,0.2)' },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkboxSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  contactMeta: { flexDirection: 'row', gap: 10, marginTop: 3 },
  metaTag: { fontSize: 12, color: COLORS.textMuted },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
});
