import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Alert, TextInput, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TIER_CONFIG, INTERACTION_TYPES, COLORS } from '../constants/theme';
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
  const [logType, setLogType] = useState(INTERACTION_TYPES[0]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [birthdayDate, setBirthdayDate] = useState(new Date(2000, 0, 1));

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
            placeholderTextColor={COLORS.textDark}
            multiline={multiline}
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
              <View>
                <Text style={styles.name}>{contact.name}</Text>
                <Text style={[styles.tierLabel, { color: tier.color }]}>
                  {tier.emoji} {tier.label}
                </Text>
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
                  <Text style={[
                    styles.tierNum,
                    contact.tier === t && { color: TIER_CONFIG[t].color },
                  ]}>
                    {TIER_CONFIG[t].emoji} {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Editable fields */}
            {/* Birthday with calendar picker */}
            <Text style={styles.sectionLabel}>🎂 BIRTHDAY</Text>
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
                <Text style={styles.calendarIcon}>📅</Text>
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
                themeVariant="dark"
              />
            )}
            {Platform.OS === 'ios' && showBirthdayPicker && (
              <TouchableOpacity onPress={() => setShowBirthdayPicker(false)} style={styles.dateDoneBtn}>
                <Text style={styles.dateDoneText}>Done</Text>
              </TouchableOpacity>
            )}
            {renderEditableField('🏠 HOW DO I KNOW THEM?', 'knowFrom', contact.knowFrom, 'Work, college, gym...')}
            {renderEditableField('🎯 HOBBIES IN COMMON', 'hobbies', contact.hobbies, 'Gaming, hiking, cooking...', true)}
            {renderEditableField('📝 NOTES', 'notes', contact.notes, 'Anything to remember...', true)}

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
              <Text style={styles.logButtonText}>Log {logType.split(' ')[0]} Today</Text>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  content: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40, maxHeight: '90%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderBottomWidth: 0,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  tierLabel: { fontSize: 14, marginTop: 4 },
  deleteBtn: {
    padding: 8, paddingHorizontal: 14, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(232,54,79,0.3)', backgroundColor: 'rgba(232,54,79,0.1)',
  },
  deleteBtnText: { color: COLORS.danger, fontSize: 13, fontWeight: '600' },
  statusCard: {
    padding: 16, borderRadius: 12, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', marginBottom: 20,
  },
  statusTime: { fontSize: 28, fontWeight: 'bold' },
  statusLabel: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  sectionLabel: { fontSize: 12, color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10, marginTop: 8 },
  tierRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  tierOption: {
    flex: 1, alignItems: 'center', padding: 10, borderRadius: 10,
    borderWidth: 2, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tierNum: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  fieldCard: {
    padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: 8, minHeight: 48,
    justifyContent: 'center',
  },
  birthdayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calendarIcon: { fontSize: 18 },
  dateDoneBtn: { alignSelf: 'flex-end', padding: 8, paddingHorizontal: 16, marginBottom: 8 },
  dateDoneText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  fieldText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  fieldPlaceholder: { fontSize: 14, color: COLORS.textDark, fontStyle: 'italic' },
  editContainer: { marginBottom: 8 },
  editInput: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    padding: 14, fontSize: 14, color: COLORS.text,
  },
  editButtons: { flexDirection: 'row', gap: 8, marginTop: 8, justifyContent: 'flex-end' },
  editCancelBtn: { padding: 8, paddingHorizontal: 16, borderRadius: 8 },
  editCancelText: { color: COLORS.textMuted, fontSize: 14 },
  editSaveBtn: { padding: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: COLORS.accent },
  editSaveText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  interactionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  interactionChip: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  interactionChipActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  interactionChipText: { fontSize: 13, color: COLORS.textMuted },
  interactionChipTextActive: { color: COLORS.text, fontWeight: '600' },
  logButton: {
    padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16,
    backgroundColor: '#4ADE80',
  },
  logButtonText: { color: '#0D0D12', fontSize: 15, fontWeight: 'bold' },
  historyItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 4,
  },
  historyType: { fontSize: 13, color: '#A09B93' },
  historyDate: { fontSize: 13, color: COLORS.textMuted },
});
