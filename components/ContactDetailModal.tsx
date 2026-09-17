import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Alert, TextInput, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ContactAvatar from './ContactAvatar';
import HobbyTagInput from './HobbyTagInput';
import Icon, { tierIconName } from './Icon';
import RecommendationsModal from './RecommendationsModal';
import { TIER_CONFIG, INTERACTION_TYPES, tierTextColor, useColors, useColorSchemeName } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { Contact } from '../constants/types';
import { formatDays, getUrgencyForContact } from '../utils/time';

interface ContactDetailModalProps {
  contact: Contact | null;
  visible: boolean;
  onClose: () => void;
  onLogInteraction: (contactId: string, type: string, date: string) => void;
  onUpdateTier: (contactId: string, tier: number) => void;
  onUpdateField: (contactId: string, field: string, value: string) => void;
  onDelete: (contactId: string) => void;
}

export default function ContactDetailModal({
  contact, visible, onClose, onLogInteraction, onUpdateTier, onUpdateField, onDelete,
}: ContactDetailModalProps) {
  const colors = useColors();
  const scheme = useColorSchemeName();
  const styles = makeStyles(colors);

  const [logType, setLogType] = useState(INTERACTION_TYPES[0]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [birthdayDate, setBirthdayDate] = useState(new Date(2000, 0, 1));
  const [showRecommendations, setShowRecommendations] = useState(false);

  if (!contact) return null;

  const tier = TIER_CONFIG[contact.tier];
  const urgency = getUrgencyForContact(contact.lastInteraction, contact.tier);
  const today = new Date().toISOString().split('T')[0];

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Remove ${contact.name} from your contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(contact.id) },
      ]
    );
  };

  const startEditing = (field: string, currentValue: string) => {
    setEditText(currentValue || '');
    setEditingField(field);
  };

  const saveField = () => {
    if (editingField) {
      onUpdateField(contact.id, editingField, editText);
    }
    setEditingField(null);
    setEditText('');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditText('');
  };

  const renderEditableField = (
    label: string,
    field: string,
    value: string,
    placeholder: string,
    multiline: boolean = false,
    keyboardType: 'default' | 'numeric' = 'default',
  ) => (
    <>
      <Text style={styles.sectionLabel}>{label}</Text>
      {editingField === field ? (
        <View style={styles.editContainer}>
          <TextInput
            style={[styles.editInput, multiline && { minHeight: 60, textAlignVertical: 'top' }]}
            value={editText}
            onChangeText={setEditText}
            placeholder={placeholder}
            placeholderTextColor={colors.textDark}
            multiline={multiline}
            keyboardType={keyboardType}
            autoFocus
          />
          <View style={styles.editButtons}>
            <TouchableOpacity onPress={cancelEditing} style={styles.editCancelBtn}>
              <Text style={styles.editCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveField} style={styles.editSaveBtn}>
              <Text style={styles.editSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity onPress={() => startEditing(field, value)} style={styles.fieldCard}>
          <Text style={value ? styles.fieldText : styles.fieldPlaceholder}>
            {value || `Tap to add ${placeholder.toLowerCase()}...`}
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <ContactAvatar name={contact.name} photoUri={contact.photoUri} size={58} borderColor={tier.color} />
                <View>
                  <Text style={styles.name}>{contact.name}</Text>
                  <View style={styles.tierLabelRow}>
                    <Icon name={tierIconName(contact.tier)} size={12} color={tierTextColor(contact.tier, scheme)} />
                    <Text style={[styles.tierLabel, { color: tierTextColor(contact.tier, scheme) }]}>{tier.label}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>

            {/* Status */}
            <View style={[styles.statusCard, { borderColor: urgency.color + '40' }]}>
              <Text style={[styles.statusTime, { color: urgency.color }]}>
                {formatDays(urgency.days)}
              </Text>
              <Text style={styles.statusLabel}>
                {urgency.status === 'ok' ? "You're on track!" :
                 urgency.status === 'soon' ? 'Due soon' :
                 urgency.status === 'overdue' ? 'Overdue' : 'Way overdue!'}
              </Text>
            </View>

            {/* Change Tier */}
            <Text style={styles.sectionLabel}>CHANGE TIER</Text>
            <View style={styles.tierRow}>
              {[1, 2, 3, 4, 5].map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => onUpdateTier(contact.id, t)}
                  style={[
                    styles.tierOption,
                    contact.tier === t && { backgroundColor: TIER_CONFIG[t].color + '20', borderColor: TIER_CONFIG[t].color + '60' },
                  ]}
                >
                  <Icon name={tierIconName(t)} size={14} color={contact.tier === t ? tierTextColor(t, scheme) : colors.textMuted} />
                  <Text style={[
                    styles.tierNum,
                    contact.tier === t && { color: tierTextColor(t, scheme) },
                  ]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Editable fields */}
            {/* Birthday with calendar picker */}
            <Text style={styles.sectionLabel}>BIRTHDAY</Text>
            <TouchableOpacity
              onPress={() => {
                // Parse existing birthday into date if possible
                if (contact.birthday) {
                  const parts = contact.birthday.split('/');
                  if (parts.length >= 2) {
                    const m = parseInt(parts[0]) - 1;
                    const d = parseInt(parts[1]);
                    const y = parts[2] ? parseInt(parts[2]) : 2000;
                    setBirthdayDate(new Date(y, m, d));
                  }
                }
                setShowBirthdayPicker(true);
              }}
              style={styles.fieldCard}
            >
              <View style={styles.birthdayRow}>
                <Text style={contact.birthday ? styles.fieldText : styles.fieldPlaceholder}>
                  {contact.birthday || 'Tap to set birthday...'}
                </Text>
                <Icon name="calendar" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
            {showBirthdayPicker && (
              <DateTimePicker
                value={birthdayDate}
                mode="date"
                display="spinner"
                onChange={(event: any, date?: Date) => {
                  if (Platform.OS === 'android') setShowBirthdayPicker(false);
                  if (date) {
                    setBirthdayDate(date);
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    const y = date.getFullYear();
                    onUpdateField(contact.id, 'birthday', `${m}/${d}/${y}`);
                  }
                }}
                maximumDate={new Date()}
                themeVariant={scheme}
              />
            )}
            {Platform.OS === 'ios' && showBirthdayPicker && (
              <TouchableOpacity onPress={() => setShowBirthdayPicker(false)} style={styles.dateDoneBtn}>
                <Text style={styles.dateDoneText}>Done</Text>
              </TouchableOpacity>
            )}
            {renderEditableField('HOW DO I KNOW THEM?', 'knowFrom', contact.knowFrom, 'Work, college, gym...')}

            <Text style={styles.sectionLabel}>HOBBIES IN COMMON</Text>
            <View style={{ marginBottom: 8 }}>
              <HobbyTagInput
                value={contact.hobbies}
                onChange={(v) => onUpdateField(contact.id, 'hobbies', v)}
                placeholder="Gaming, hiking, cooking..."
              />
            </View>

            {renderEditableField('ZIP CODE', 'zipCode', contact.zipCode, 'Where they live, e.g. 90210', false, 'numeric')}

            <TouchableOpacity
              style={styles.recommendBtn}
              onPress={() => setShowRecommendations(true)}
            >
              <Icon name="compass" size={16} color={colors.accent} />
              <Text style={styles.recommendBtnText}>Find Activities Nearby</Text>
            </TouchableOpacity>

            {renderEditableField('NOTES', 'notes', contact.notes, 'Anything to remember...', true)}

            {/* Log Interaction */}
            <Text style={styles.sectionLabel}>LOG INTERACTION</Text>
            <View style={styles.interactionGrid}>
              {INTERACTION_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setLogType(type)}
                  style={[
                    styles.interactionChip,
                    logType === type && styles.interactionChipActive,
                  ]}
                >
                  <Text style={[
                    styles.interactionChipText,
                    logType === type && styles.interactionChipTextActive,
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.logButton}
              onPress={() => {
                onLogInteraction(contact.id, logType, today);
                setLogType(INTERACTION_TYPES[0]);
              }}
            >
              <Text style={styles.logButtonText}>Log {logType} Today</Text>
            </TouchableOpacity>

            {/* History */}
            {contact.history && contact.history.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>RECENT HISTORY</Text>
                {contact.history.slice(0, 10).map((h, i) => (
                  <View key={i} style={styles.historyItem}>
                    <Text style={styles.historyType}>{h.type}</Text>
                    <Text style={styles.historyDate}>{h.date}</Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>

      <RecommendationsModal
        contact={contact}
        visible={showRecommendations}
        onClose={() => setShowRecommendations(false)}
      />
    </Modal>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  content: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '90%',
    borderWidth: 1, borderColor: colors.cardBorder, borderBottomWidth: 0,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  name: { fontSize: 22, fontFamily: FONTS.displayBold, color: colors.text },
  tierLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  tierLabel: { fontSize: 13, fontFamily: FONTS.bodyMedium },
  deleteBtn: {
    padding: 8, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(232,54,79,0.3)', backgroundColor: 'rgba(232,54,79,0.1)',
  },
  deleteBtnText: { color: colors.danger, fontSize: 13, fontFamily: FONTS.bodySemiBold },
  statusCard: {
    padding: 18, borderRadius: 16, borderWidth: 1,
    backgroundColor: colors.cardBg, alignItems: 'center', marginBottom: 22,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 2,
  },
  statusTime: { fontSize: 28, fontFamily: FONTS.displayBold },
  statusLabel: { fontSize: 13, fontFamily: FONTS.body, color: colors.textMuted, marginTop: 5 },
  sectionLabel: { fontSize: 11, fontFamily: FONTS.bodySemiBold, color: colors.textMuted, letterSpacing: 1.2, marginBottom: 10, marginTop: 8 },
  tierRow: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  tierOption: {
    flex: 1, alignItems: 'center', gap: 4, padding: 10, borderRadius: 12,
    borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.cardBg,
  },
  tierNum: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: colors.textMuted },
  fieldCard: {
    padding: 14, borderRadius: 14, backgroundColor: colors.cardBg,
    borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 8, minHeight: 48,
    justifyContent: 'center',
  },
  birthdayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateDoneBtn: { alignSelf: 'flex-end', padding: 8, paddingHorizontal: 16, marginBottom: 8 },
  dateDoneText: { color: colors.accent, fontSize: 15, fontFamily: FONTS.bodySemiBold },
  fieldText: { fontSize: 14, fontFamily: FONTS.body, color: colors.text, lineHeight: 20 },
  fieldPlaceholder: { fontSize: 14, fontFamily: FONTS.body, color: colors.textDark, fontStyle: 'italic' },
  recommendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 13, borderRadius: 14, marginBottom: 18, marginTop: 4,
    backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '30',
  },
  recommendBtnText: { fontSize: 14, fontFamily: FONTS.bodySemiBold, color: colors.accent },
  editContainer: { marginBottom: 8 },
  editInput: {
    backgroundColor: colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: colors.accent + '50',
    padding: 14, fontSize: 14, fontFamily: FONTS.body, color: colors.text,
  },
  editButtons: { flexDirection: 'row', gap: 8, marginTop: 8, justifyContent: 'flex-end' },
  editCancelBtn: { padding: 8, paddingHorizontal: 16, borderRadius: 8 },
  editCancelText: { color: colors.textMuted, fontSize: 14, fontFamily: FONTS.bodyMedium },
  editSaveBtn: { padding: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.accent },
  editSaveText: { color: '#fff', fontSize: 14, fontFamily: FONTS.bodySemiBold },
  interactionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  interactionChip: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: colors.cardBg,
  },
  interactionChipActive: { backgroundColor: colors.cardBorder },
  interactionChipText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: colors.textMuted },
  interactionChipTextActive: { color: colors.text, fontFamily: FONTS.bodySemiBold },
  logButton: {
    padding: 15, borderRadius: 14, alignItems: 'center', marginBottom: 18,
    backgroundColor: colors.success,
  },
  logButtonText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bodySemiBold },
  historyItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 12, borderRadius: 12, backgroundColor: colors.cardBg, marginBottom: 5,
  },
  historyType: { fontSize: 13, fontFamily: FONTS.body, color: colors.text },
  historyDate: { fontSize: 13, fontFamily: FONTS.body, color: colors.textMuted },
});
