import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ContactAvatar from './ContactAvatar';
import { TIER_CONFIG, COLORS } from '../constants/theme';
import { Contact } from '../constants/types';
import { formatDays, getUrgencyForContact } from '../utils/time';

interface ContactCardProps {
  contact: Contact;
  onPress: () => void;
  onLongPress: () => void;
}

export default function ContactCard({ contact, onPress, onLongPress }: ContactCardProps) {
  const tier = TIER_CONFIG[contact.tier];
  const urgency = getUrgencyForContact(contact.lastInteraction, contact.tier);

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
            <ContactAvatar name={contact.name} photoUri={contact.photoUri} size={42} borderColor={tier.color} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{contact.name}</Text>
            <Text style={[styles.tierLabel, { color: tier.color }]}>
              {tier.emoji} {tier.label}
            </Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          <Text style={[styles.timeAgo, { color: urgency.color }]}>
            {formatDays(urgency.days)}
          </Text>
          {contact.interactionType && (
            <Text style={styles.interactionIcon}>
              {contact.interactionType.split(' ')[0]}
            </Text>
          )}
        </View>
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
            ? '⚠️ Way overdue!'
            : urgency.status === 'overdue'
            ? `⏰ Overdue by ${urgency.days - urgency.maxDays}d`
            : `📅 Due in ~${urgency.maxDays - urgency.days}d`}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    fontWeight: '600',
    color: COLORS.text,
  },
  tierLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    fontSize: 14,
    fontWeight: '600',
  },
  interactionIcon: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  progressBg: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  urgencyText: {
    fontSize: 11,
    marginTop: 6,
  },
});
