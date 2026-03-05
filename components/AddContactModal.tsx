import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TIER_CONFIG, COLORS } from '../constants/theme';
import { Contact } from '../constants/types';

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (contact: Contact) => void;
}

export default function AddContactModal({ visible, onClose, onAdd }: AddContactModalProps) {
  const [name, setName] = useState('');
  const [tier, setTier] = useState(3);
  const [birthday, setBirthday] = useState('');
  const [birthdayDate, setBirthdayDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hobbies, setHobbies] = useState('');
  const [knowFrom, setKnowFrom] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const newContact: Contact = {
      id: Date.now().toString(),
      name: name.trim(),
      tier,
      lastInteraction: null,
      interactionType: null,
      history: [],
      birthday: birthday.trim(),
      hobbies: hobbies.trim(),
      knowFrom: knowFrom.trim(),
      notes: notes.trim(),
    };
    onAdd(newContact);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setTier(3);
    setBirthday('');
    setBirthdayDate(new Date(2000, 0, 1));
    setShowDatePicker(false);
    setHobbies('');
    setKnowFrom('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.content}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>Add Contact</Text>

              <Text style={styles.label}>NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name..."
                placeholderTextColor={COLORS.textDark}
                value={name}
                onChangeText={setName}
                autoFocus
              />

              <Text style={styles.label}>FRIENDSHIP TIER</Text>
              <View style={styles.tierRow}>
                {[1, 2, 3, 4, 5].map(t => {
                  const config = TIER_CONFIG[t];
                  const selected = tier === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setTier(t)}
                      style={[
                        styles.tierOption,
                        selected && { backgroundColor: config.color + '20', borderColor: config.color + '60' },
                      ]}
                    >
                      <Text style={styles.tierEmoji}>{config.emoji}</Text>
                      <Text style={[styles.tierNum, selected && { color: config.color }]}>T{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.tierDesc}>
                <Text style={[styles.tierDescText, { color: TIER_CONFIG[tier].color }]}>
                  {TIER_CONFIG[tier].emoji} {TIER_CONFIG[tier].label}
                </Text>
                <Text style={styles.tierDescSub}>
                  Reach out every {TIER_CONFIG[tier].maxDays} days
                </Text>
              </View>

              <Text style={styles.label}>🎂 BIRTHDAY (OPTIONAL)</Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={birthday ? styles.datePickerText : styles.datePickerPlaceholder}>
                  {birthday || 'Tap to select birthday...'}
                </Text>
                <Text style={styles.datePickerIcon}>📅</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={birthdayDate}
                  mode="date"
                  display="spinner"
                  onChange={(event: any, date?: Date) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (date) {
                      setBirthdayDate(date);
                      const m = String(date.getMonth() + 1).padStart(2, '0');
                      const d = String(date.getDate()).padStart(2, '0');
                      const y = date.getFullYear();
                      setBirthday(`${m}/${d}/${y}`);
                    }
                  }}
                  maximumDate={new Date()}
                  themeVariant="dark"
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.dateDoneBtn}>
                  <Text style={styles.dateDoneText}>Done</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.label}>🏠 HOW DO I KNOW THEM? (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Work, college, gym, mutual friend..."
                placeholderTextColor={COLORS.textDark}
                value={knowFrom}
                onChangeText={setKnowFrom}
              />

              <Text style={styles.label}>🎯 HOBBIES IN COMMON (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Gaming, hiking, cooking..."
                placeholderTextColor={COLORS.textDark}
                value={hobbies}
                onChangeText={setHobbies}
                multiline
              />

              <Text style={styles.label}>📝 NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Anything else to remember..."
                placeholderTextColor={COLORS.textDark}
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <View style={styles.buttons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, !name.trim() && { opacity: 0.4 }]}
                  onPress={handleAdd}
                >
                  <Text style={styles.saveText}>Add Contact</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  content: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderBottomWidth: 0,
    maxHeight: '85%',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
  label: { fontSize: 12, color: COLORS.textMuted, letterSpacing: 1, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 14, fontSize: 16, color: COLORS.text, marginBottom: 20,
  },
  tierRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tierOption: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 12,
    borderWidth: 2, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tierEmoji: { fontSize: 20, marginBottom: 4 },
  tierNum: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  tierDesc: { alignItems: 'center', marginBottom: 20 },
  tierDescText: { fontSize: 14, fontWeight: '600' },
  tierDescSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  buttons: { flexDirection: 'row', gap: 10 },
  datePickerBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  datePickerText: { fontSize: 16, color: COLORS.text },
  datePickerPlaceholder: { fontSize: 16, color: COLORS.textDark },
  datePickerIcon: { fontSize: 18 },
  dateDoneBtn: { alignSelf: 'flex-end', padding: 8, paddingHorizontal: 16, marginBottom: 12 },
  dateDoneText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.accent },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
