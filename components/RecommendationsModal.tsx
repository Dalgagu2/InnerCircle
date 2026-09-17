import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Linking, ActivityIndicator,
} from 'react-native';
import Icon from './Icon';
import { useColors } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { Contact } from '../constants/types';
import { buildActivitySearches, requestDeviceLocation, ActivitySearch } from '../utils/recommendations';

interface RecommendationsModalProps {
  contact: Contact | null;
  visible: boolean;
  onClose: () => void;
}

export default function RecommendationsModal({ contact, visible, onClose }: RecommendationsModalProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const [loading, setLoading] = useState(false);
  const [searches, setSearches] = useState<ActivitySearch[]>([]);
  const [usedDeviceLocation, setUsedDeviceLocation] = useState(false);

  useEffect(() => {
    if (!visible || !contact) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const zip = (contact.zipCode || '').trim();
      // Only bother asking for device location when there's no zip code to fall back on.
      const coords = zip ? null : await requestDeviceLocation();
      if (cancelled) return;
      setUsedDeviceLocation(!zip && !!coords);
      setSearches(buildActivitySearches(contact.hobbies, contact.zipCode, coords));
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [visible, contact]);

  if (!contact) return null;

  const locationLabel = (contact.zipCode || '').trim()
    ? `near ${contact.zipCode}`
    : usedDeviceLocation
      ? 'near your current location'
      : '';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.content}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Activity Ideas</Text>
              <Text style={styles.subtitle}>
                For {contact.name}{locationLabel ? ` ${locationLabel}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.centerText}>Getting your location...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {searches.length === 0 && (
                <View style={styles.errorBox}>
                  <Icon name="warning" size={14} color={colors.warning} />
                  <Text style={styles.errorText}>
                    Add a hobby for {contact.name} to get activity ideas.
                  </Text>
                </View>
              )}

              {!(contact.zipCode || '').trim() && !usedDeviceLocation && searches.length > 0 && (
                <View style={styles.errorBox}>
                  <Icon name="warning" size={14} color={colors.warning} />
                  <Text style={styles.errorText}>
                    No zip code or location access — searches below aren&apos;t centered on a place yet.
                  </Text>
                </View>
              )}

              {searches.map(s => (
                <TouchableOpacity
                  key={s.hobby}
                  style={styles.card}
                  onPress={() => Linking.openURL(s.mapsUrl)}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.cardName}>{s.hobby}</Text>
                    <Icon name="compass" size={16} color={colors.accent} />
                  </View>
                  <Text style={styles.cardHint}>Open in Maps</Text>
                </TouchableOpacity>
              ))}

              <View style={{ height: 20 }} />
            </ScrollView>
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
    padding: 24, paddingBottom: 40, maxHeight: '85%', minHeight: '50%',
    borderWidth: 1, borderColor: colors.cardBorder, borderBottomWidth: 0,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 20, fontFamily: FONTS.displayBold, color: colors.text },
  subtitle: { fontSize: 13, fontFamily: FONTS.body, color: colors.textMuted, marginTop: 3 },
  closeBtn: { padding: 6 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  centerText: { fontSize: 14, fontFamily: FONTS.body, color: colors.textMuted, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 14,
    backgroundColor: colors.warning + '15', borderWidth: 1, borderColor: colors.warning + '30',
    marginBottom: 10,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: FONTS.body, color: colors.text, lineHeight: 18 },
  card: {
    padding: 14, borderRadius: 14, backgroundColor: colors.cardBg,
    borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardName: { flex: 1, fontSize: 15, fontFamily: FONTS.bodySemiBold, color: colors.text, textTransform: 'capitalize' },
  cardHint: { fontSize: 13, fontFamily: FONTS.body, color: colors.textMuted, marginTop: 4 },
});
