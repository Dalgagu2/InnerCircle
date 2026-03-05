import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { TIER_CONFIG, COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const PAGES = [
  {
    emoji: '👋',
    title: 'Welcome to Inner Circle',
    body: 'The app that helps you stay in touch with the people who matter most.',
  },
  {
    emoji: '🏷️',
    title: 'Friendship Tiers',
    body: 'Organize your contacts into 5 tiers. Each tier has a different check-in frequency — from every 3 days for your inner circle to every 90 days for acquaintances.',
  },
  {
    emoji: '⏰',
    title: 'Never Lose Touch',
    body: 'Get reminders when you haven\'t reached out to someone in a while. Log your interactions and watch your relationships thrive.',
  },
  {
    emoji: '🚀',
    title: 'Ready to Start?',
    body: 'Add your first contacts and start building better relationships today.',
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [page, setPage] = useState(0);
  const current = PAGES[page];
  const isLast = page === PAGES.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>

        {page === 1 && (
          <View style={styles.tierPreview}>
            {[1, 2, 3, 4, 5].map(t => (
              <View key={t} style={[styles.tierRow, { borderLeftColor: TIER_CONFIG[t].color }]}>
                <Text style={styles.tierEmoji}>{TIER_CONFIG[t].emoji}</Text>
                <View>
                  <Text style={[styles.tierLabel, { color: TIER_CONFIG[t].color }]}>
                    Tier {t}: {TIER_CONFIG[t].label}
                  </Text>
                  <Text style={styles.tierFreq}>
                    Every {TIER_CONFIG[t].maxDays} days
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        {page > 0 ? (
          <TouchableOpacity onPress={() => setPage(page - 1)} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <TouchableOpacity
          onPress={isLast ? onComplete : () => setPage(page + 1)}
          style={styles.nextBtn}
        >
          <Text style={styles.nextText}>{isLast ? "Let's Go!" : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'space-between', padding: 24, paddingTop: 80 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  body: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24, paddingHorizontal: 16 },
  tierPreview: { marginTop: 24, width: '100%' },
  tierRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 6,
    borderLeftWidth: 3, paddingLeft: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8,
  },
  tierEmoji: { fontSize: 20, marginRight: 12 },
  tierLabel: { fontSize: 14, fontWeight: '600' },
  tierFreq: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive: { backgroundColor: COLORS.accent, width: 24 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingBottom: 20 },
  backBtn: { flex: 1, padding: 16, borderRadius: 14, alignItems: 'center' },
  backText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
  nextBtn: { flex: 2, padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: COLORS.accent },
  nextText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
