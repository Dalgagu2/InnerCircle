import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon, { tierIconName } from './Icon';
import { TIER_CONFIG, tierTextColor, useColors, useColorSchemeName } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { Contact } from '../constants/types';

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (contact: Contact) => void;
}

export default function AddContactModal({ visible, onClose, onAdd }: AddContactModalProps) {
  const colors = useColors();
  const scheme = useColorSchemeName();
  const styles = makeStyles(colors);

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
      // eslint-disable-next-line react-hooks/purity -- runs in a press handler, not during render
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
                placeholderTextColor={colors.textDark}
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
                      <Icon name={tierIconName(t)} size={18} color={selected ? tierTextColor(t, scheme) : colors.textMuted} />
                      <Text style={[styles.tierNum, selected && { color: tierTextColor(t, scheme) }]}>T{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.tierDesc}>
                <View style={styles.tierDescRow}>
                  <Icon name={tierIconName(tier)} size={14} color={tierTextColor(tier, scheme)} />
                  <Text style={[styles.tierDescText, { color: tierTextColor(tier, scheme) }]}>
                    {TIER_CONFIG[tier].label}
                  </Text>
                </View>
                <Text style={styles.tierDescSub}>
                  Reach out every {TIER_CONFIG[tier].maxDays} days
                </Text>
              </View>

              <Text style={styles.label}>BIRTHDAY (OPTIONAL)</Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={birthday ? styles.datePickerText : styles.datePickerPlaceholder}>
                  {birthday || 'Tap to select birthday...'}
                </Text>
                <Icon name="calendar" size={16} color={colors.textMuted} />
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
                  themeVariant={scheme}
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.dateDoneBtn}>
                  <Text style={styles.dateDoneText}>Done</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.label}>HOW DO I KNOW THEM? (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Work, college, gym, mutual friend..."
                placeholderTextColor={colors.textDark}
                value={knowFrom}
                onChangeText={setKnowFrom}
              />

              <Text style={styles.label}>HOBBIES IN COMMON (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Gaming, hiking, cooking..."
                placeholderTextColor={colors.textDark}
                value={hobbies}
                onChangeText={setHobbies}
                multiline
              />

              <Text style={styles.label}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Anything else to remember..."
                placeholderTextColor={colors.textDark}
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

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  content: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: colors.cardBorder, borderBottomWidth: 0,
    maxHeight: '85%',
  },
  title: { fontSize: 22, fontFamily: FONTS.displayBold, color: colors.text, marginBottom: 20 },
  label: { fontSize: 11, fontFamily: FONTS.bodySemiBold, color: colors.textMuted, letterSpacing: 1.2, marginBottom: 8 },
  input: {
    backgroundColor: colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: 14, fontSize: 16, fontFamily: FONTS.body, color: colors.text, marginBottom: 20,
  },
  tierRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tierOption: {
    flex: 1, alignItems: 'center', gap: 5, padding: 12, borderRadius: 14,
    borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.cardBg,
  },
  tierNum: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: colors.textMuted },
  tierDesc: { alignItems: 'center', marginBottom: 20 },
  tierDescRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tierDescText: { fontSize: 14, fontFamily: FONTS.bodySemiBold },
  tierDescSub: { fontSize: 12, fontFamily: FONTS.body, color: colors.textMuted, marginTop: 3 },
  buttons: { flexDirection: 'row', gap: 10 },
  datePickerBtn: {
    backgroundColor: colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  datePickerText: { fontSize: 16, fontFamily: FONTS.body, color: colors.text },
  datePickerPlaceholder: { fontSize: 16, fontFamily: FONTS.body, color: colors.textDark },
  dateDoneBtn: { alignSelf: 'flex-end', padding: 8, paddingHorizontal: 16, marginBottom: 12 },
  dateDoneText: { color: colors.accent, fontSize: 15, fontFamily: FONTS.bodySemiBold },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  cancelText: { color: colors.textMuted, fontSize: 16, fontFamily: FONTS.bodySemiBold },
  saveBtn: { flex: 2, padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.accent },
  saveText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.bodySemiBold },
});
