import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ContactAvatar from './ContactAvatar';
import Icon, { tierIconName } from './Icon';
import { TIER_CONFIG, tierTextColor, useColors, useColorSchemeName } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { Contact } from '../constants/types';
import { formatDays, getUrgencyForContact } from '../utils/time';

interface ContactCardProps {
  contact: Contact;
  onPress: () => void;
  onLongPress: () => void;
}

export default function ContactCard({ contact, onPress, onLongPress }: ContactCardProps) {
  const colors = useColors();
  const scheme = useColorSchemeName();
  const tier = TIER_CONFIG[contact.tier];
  const urgency = getUrgencyForContact(contact.lastInteraction, contact.tier);
  const styles = makeStyles(colors);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        urgency.status === 'critical' && { borderColor: 'rgba(232,54,79,0.4)' },
        urgency.status === 'overdue' && { borderColor: 'rgba(232,124,54,0.3)' },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          <View style={styles.avatarWrap}>
            <ContactAvatar name={contact.name} photoUri={contact.photoUri} size={44} borderColor={tier.color} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{contact.name}</Text>
            <View style={styles.tierRow}>
              <Icon name={tierIconName(contact.tier)} size={11} color={tierTextColor(contact.tier, scheme)} />
              <Text style={[styles.tierLabel, { color: tierTextColor(contact.tier, scheme) }]}>{tier.label}</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.timeAgo, { color: urgency.color }]}>
          {formatDays(urgency.days)}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(urgency.progress * 100, 100)}%`,
              backgroundColor: urgency.color,
            },
          ]}
        />
      </View>

      {urgency.status !== 'ok' && (
        <Text style={[styles.urgencyText, { color: urgency.color }]}>
          {urgency.status === 'critical'
            ? 'Way overdue'
            : urgency.status === 'overdue'
            ? `Overdue by ${urgency.days - urgency.maxDays}d`
            : `Due in ~${urgency.maxDays - urgency.days}d`}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 10,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrap: {
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: FONTS.bodySemiBold,
    color: colors.text,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  tierLabel: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
  },
  timeAgo: {
    fontSize: 14,
    fontFamily: FONTS.bodySemiBold,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cardBorder,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  urgencyText: {
    fontSize: 11,
    fontFamily: FONTS.bodyMedium,
    marginTop: 7,
  },
});
