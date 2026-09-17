import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from './Icon';
import { useColors } from '../constants/theme';
import { FONTS } from '../constants/fonts';

interface HobbyTagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

export default function HobbyTagInput({ value, onChange, placeholder }: HobbyTagInputProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const tags = parseTags(value);
  const [draft, setDraft] = useState('');

  const commit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...tags, trimmed].join(', '));
  };

  // Comma is the tag-commit key so multi-word hobbies (e.g. "board games") can
  // still be typed with a plain space in the middle.
  const handleChangeText = (text: string) => {
    if (text.includes(',')) {
      const parts = text.split(',');
      const last = parts.pop() || '';
      parts.forEach(commit);
      setDraft(last);
    } else {
      setDraft(text);
    }
  };

  const handleSubmit = () => {
    commit(draft);
    setDraft('');
  };

  const handleBlur = () => {
    if (draft.trim()) {
      commit(draft);
      setDraft('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag).join(', '));
  };

  return (
    <View style={styles.container}>
      {tags.map(tag => (
        <View key={tag} style={styles.chip}>
          <Text style={styles.chipText}>{tag}</Text>
          <TouchableOpacity onPress={() => removeTag(tag)} hitSlop={6}>
            <Icon name="close" size={10} color={colors.accent} />
          </TouchableOpacity>
        </View>
      ))}
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        onBlur={handleBlur}
        placeholder={tags.length === 0 ? placeholder : 'Add another...'}
        placeholderTextColor={colors.textDark}
        returnKeyType="done"
        blurOnSubmit={false}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8,
    backgroundColor: colors.cardBg, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder,
    padding: 10, minHeight: 48,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10,
    backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '30',
  },
  chipText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: colors.accent },
  input: {
    flexGrow: 1, minWidth: 100, fontSize: 14, fontFamily: FONTS.body, color: colors.text,
    paddingVertical: 6, paddingHorizontal: 4,
  },
});
