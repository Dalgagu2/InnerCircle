import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, ActivityIndicator, Alert, TextInput, Platform,
} from 'react-native';
import * as Contacts from 'expo-contacts/legacy';
import ContactAvatar from './ContactAvatar';
import Icon, { tierIconName } from './Icon';
import { TIER_CONFIG, tierTextColor, useColors, useColorSchemeName } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { Contact } from '../constants/types';
import { resolveContactPhotoUri } from '../utils/contactPhoto';

interface PhoneContact {
  id: string;
  name: string;
  birthday: string;
  company: string;
  image?: Contacts.Image;
}

interface ImportContactsModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (contacts: Contact[]) => void;
  existingNames: string[];
}

type Mode = 'choose' | 'pick' | 'bulk';

export default function ImportContactsModal({ visible, onClose, onImport, existingNames }: ImportContactsModalProps) {
  const colors = useColors();
  const scheme = useColorSchemeName();
  const styles = makeStyles(colors);

  const [mode, setMode] = useState<Mode>('choose');
  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tier, setTier] = useState(3);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sessionImportedNames, setSessionImportedNames] = useState<string[]>([]);
  const [pickedContact, setPickedContact] = useState<PhoneContact | null>(null);

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets local state each time this always-mounted modal opens
      setMode('choose');
      setSelected(new Set());
      setTier(3);
      setSearchQuery('');
      setPhoneContacts([]);
      setSuccessMessage('');
      setImporting(false);
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

      // The picker doesn't always include image bytes even when a photo exists
      let image = contact.image;
      if (!image && contact.imageAvailable) {
        const full = await Contacts.getContactByIdAsync(contact.id, [Contacts.Fields.Image]);
        image = full?.image;
      }

      setPickedContact({
        // eslint-disable-next-line react-hooks/purity -- runs in a press handler, not during render
        id: contact.id || Date.now().toString(),
        name: name.trim(),
        birthday,
        company,
        image,
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

  const confirmPickedContact = async () => {
    if (!pickedContact) return;
    setImporting(true);

    const photoUri = await resolveContactPhotoUri(pickedContact.image);

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
      photoUri,
    };

    onImport([newContact]);
    setSessionImportedNames(prev => [...prev, pickedContact.name]);
    setSuccessMessage(`Added ${pickedContact.name}!`);
    setPickedContact(null);
    setImporting(false);
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
          Contacts.Fields.Image,
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
            image: c.image,
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

  const handleBulkImport = async () => {
    const toImport = phoneContacts.filter(c => selected.has(c.id));
    if (toImport.length === 0) return;
    setImporting(true);
    const count = toImport.length;
    const importedNames = toImport.map(c => c.name);

    const newContacts: Contact[] = await Promise.all(
      toImport.map(async c => ({
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
        photoUri: await resolveContactPhotoUri(c.image),
      }))
    );

    onImport(newContacts);
    setSessionImportedNames(prev => [...prev, ...importedNames]);
    setSelected(new Set());
    setImporting(false);
    setSuccessMessage(`Imported ${count} ${count === 1 ? 'contact' : 'contacts'}!`);
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
              <Icon name={tierIconName(t)} size={15} color={isSelected ? tierTextColor(t, scheme) : colors.textMuted} />
              <Text style={[styles.tierNum, isSelected && { color: tierTextColor(t, scheme) }]}>T{t}</Text>
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
              <Icon name="close" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Success banner */}
          {successMessage !== '' && (
            <View style={styles.successBanner}>
              <Icon name="check" size={14} color={colors.success} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* ─── Choose Mode ─── */}
          {mode === 'choose' && (
            <View>
              <Text style={styles.modeDesc}>How would you like to import contacts?</Text>

              <TouchableOpacity style={styles.modeCard} onPress={pickSingleContact}>
                <View style={styles.modeCardIcon}>
                  <Icon name="user-plus" size={20} color={colors.accent} />
                </View>
                <View style={styles.modeCardInfo}>
                  <Text style={styles.modeCardTitle}>Pick One at a Time</Text>
                  <Text style={styles.modeCardDesc}>
                    Opens your phone&apos;s contact picker. No permissions needed. Tap again to add another.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modeCard} onPress={startBulkImport}>
                <View style={styles.modeCardIcon}>
                  <Icon name="list" size={20} color={colors.accent} />
                </View>
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
                <View style={styles.pickedAvatarWrap}>
                  <ContactAvatar name={pickedContact.name} photoUri={pickedContact.image?.uri} size={60} borderColor={colors.accent} />
                </View>
                <Text style={styles.pickedName}>{pickedContact.name}</Text>
                {pickedContact.birthday ? <Text style={styles.pickedMeta}>{pickedContact.birthday}</Text> : null}
                {pickedContact.company ? <Text style={styles.pickedMeta}>{pickedContact.company}</Text> : null}
              </View>

              {renderTierSelector()}

              <View style={styles.bottomButtons}>
                <TouchableOpacity style={styles.backBtn} onPress={() => { setPickedContact(null); setMode('choose'); }}>
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.importBtn, importing && { opacity: 0.6 }]}
                  onPress={confirmPickedContact}
                  disabled={importing}
                >
                  {importing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.importBtnText}>Add {pickedContact.name.split(' ')[0]}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ─── Bulk Mode ─── */}
          {mode === 'bulk' && (
            <>
              {loading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={colors.accent} />
                  <Text style={styles.loadingText}>Reading your contacts...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.searchContainer}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search contacts..."
                      placeholderTextColor={colors.textDark}
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
                        <Icon
                          name={searchQuery ? 'search' : phoneContacts.length === 0 ? 'no-signal' : 'check'}
                          size={30}
                          color={colors.textMuted}
                        />
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
                              {isSelected && <Icon name="check" size={12} color="#fff" strokeWidth={3} />}
                            </View>
                            <View style={styles.contactRowAvatar}>
                              <ContactAvatar name={contact.name} photoUri={contact.image?.uri} size={36} />
                            </View>
                            <View style={styles.contactInfo}>
                              <Text style={styles.contactName}>{contact.name}</Text>
                              <View style={styles.contactMeta}>
                                {contact.birthday ? <Text style={styles.metaTag}>{contact.birthday}</Text> : null}
                                {contact.company ? <Text style={styles.metaTag}>{contact.company}</Text> : null}
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
                      style={[styles.importBtn, (selectedCount === 0 || importing) && { opacity: 0.35 }]}
                      onPress={handleBulkImport}
                      disabled={selectedCount === 0 || importing}
                    >
                      {importing ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.importBtnText}>
                          {selectedCount === 0 ? 'Select contacts' : `Import ${selectedCount}`}
                        </Text>
                      )}
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

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  content: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, maxHeight: '92%',
    borderWidth: 1, borderColor: colors.cardBorder, borderBottomWidth: 0,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontFamily: FONTS.displayBold, color: colors.text },
  closeX: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.cardBg, alignItems: 'center', justifyContent: 'center' },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    padding: 12, borderRadius: 12, marginBottom: 12,
    backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
  },
  successText: { color: colors.success, fontSize: 13, fontFamily: FONTS.bodySemiBold, textAlign: 'center' },
  modeDesc: { fontSize: 14, fontFamily: FONTS.body, color: colors.textMuted, marginBottom: 16 },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10,
    borderRadius: 16, backgroundColor: colors.cardBg,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  modeCardIcon: {
    width: 44, height: 44, borderRadius: 14, marginRight: 14,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent + '18',
  },
  modeCardInfo: { flex: 1 },
  modeCardTitle: { fontSize: 16, fontFamily: FONTS.bodySemiBold, color: colors.text, marginBottom: 4 },
  modeCardDesc: { fontSize: 13, fontFamily: FONTS.body, color: colors.textMuted, lineHeight: 18 },
  sessionCount: { fontSize: 13, fontFamily: FONTS.body, color: colors.textMuted, textAlign: 'center', marginTop: 10 },
  pickedCard: {
    alignItems: 'center', padding: 24, marginBottom: 16, borderRadius: 18,
    backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder,
  },
  pickedAvatarWrap: { marginBottom: 12 },
  pickedName: { fontSize: 20, fontFamily: FONTS.displayBold, color: colors.text, marginBottom: 6 },
  pickedMeta: { fontSize: 13, fontFamily: FONTS.body, color: colors.textMuted, marginTop: 2 },
  tierSection: { marginBottom: 14 },
  label: { fontSize: 11, fontFamily: FONTS.bodySemiBold, color: colors.textMuted, letterSpacing: 1.2, marginBottom: 8 },
  tierRow: { flexDirection: 'row', gap: 6 },
  tierOption: {
    flex: 1, alignItems: 'center', gap: 3, padding: 10, borderRadius: 12,
    borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.cardBg,
  },
  tierNum: { fontSize: 11, fontFamily: FONTS.bodySemiBold, color: colors.textMuted },
  bottomButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  backBtn: {
    flex: 1, padding: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  backBtnText: { color: colors.textMuted, fontSize: 15, fontFamily: FONTS.bodySemiBold },
  importBtn: { flex: 2, padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.accent },
  importBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bodySemiBold },
  centered: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  loadingText: { color: colors.textMuted, marginTop: 4, fontSize: 14, fontFamily: FONTS.body },
  searchContainer: { marginBottom: 10 },
  searchInput: {
    backgroundColor: colors.cardBg, borderRadius: 12,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: 10, fontSize: 14, fontFamily: FONTS.body, color: colors.text,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  selectAllBtn: { padding: 6 },
  selectAllText: { color: colors.accent, fontSize: 13, fontFamily: FONTS.bodySemiBold },
  countText: { color: colors.textMuted, fontSize: 12, fontFamily: FONTS.body },
  list: { maxHeight: 220, marginBottom: 10 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 4,
    borderRadius: 12, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: 'transparent',
  },
  contactRowSelected: { backgroundColor: 'rgba(232,54,79,0.08)', borderColor: 'rgba(232,54,79,0.25)' },
  checkbox: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2,
    borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkboxSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  contactRowAvatar: { marginRight: 10 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontFamily: FONTS.bodyMedium, color: colors.text },
  contactMeta: { flexDirection: 'row', gap: 10, marginTop: 3 },
  metaTag: { fontSize: 12, fontFamily: FONTS.body, color: colors.textMuted },
  emptyText: { fontSize: 16, fontFamily: FONTS.bodySemiBold, color: colors.text },
});
