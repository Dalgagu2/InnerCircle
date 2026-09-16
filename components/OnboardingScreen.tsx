import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon, { IconName, tierIconName } from './Icon';
import { TIER_CONFIG, tierTextColor, useColors, useColorSchemeName } from '../constants/theme';
import { FONTS } from '../constants/fonts';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const PAGES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'wave',
    title: 'Welcome to Inner Circle',
    body: 'The app that helps you stay in touch with the people who matter most.',
  },
  {
    icon: 'tag',
    title: 'Friendship Tiers',
    body: 'Organize your contacts into 5 tiers. Each tier has a different check-in frequency — from every 3 days for your inner circle to every 90 days for acquaintances.',
  },
  {
    icon: 'clock',
    title: 'Never Lose Touch',
    body: 'Get reminders when you haven\'t reached out to someone in a while. Log your interactions and watch your relationships thrive.',
  },
  {
    icon: 'rocket',
    title: 'Ready to Start?',
    body: 'Add your first contacts and start building better relationships today.',
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const colors = useColors();
  const scheme = useColorSchemeName();
  const styles = makeStyles(colors);

  const [page, setPage] = useState(0);
  const current = PAGES[page];
  const isLast = page === PAGES.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Icon name={current.icon} size={40} color={colors.accent} strokeWidth={1.6} />
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>

        {page === 1 && (
          <View style={styles.tierPreview}>
            {[1, 2, 3, 4, 5].map(t => (
              <View key={t} style={[styles.tierRow, { borderLeftColor: TIER_CONFIG[t].color }]}>
                <Icon name={tierIconName(t)} size={18} color={tierTextColor(t, scheme)} />
                <View>
                  <Text style={[styles.tierLabel, { color: tierTextColor(t, scheme) }]}>
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

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between', padding: 24, paddingTop: 80 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44, marginBottom: 28,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '30',
  },
  title: { fontSize: 26, fontFamily: FONTS.displayBold, color: colors.text, textAlign: 'center', marginBottom: 16 },
  body: { fontSize: 16, fontFamily: FONTS.body, color: colors.textMuted, textAlign: 'center', lineHeight: 24, paddingHorizontal: 16 },
  tierPreview: { marginTop: 24, width: '100%' },
  tierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 6,
    borderLeftWidth: 3, paddingLeft: 12, backgroundColor: colors.cardBg, borderRadius: 10,
  },
  tierLabel: { fontSize: 14, fontFamily: FONTS.bodySemiBold },
  tierFreq: { fontSize: 12, fontFamily: FONTS.body, color: colors.textMuted, marginTop: 1 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.cardBorder },
  dotActive: { backgroundColor: colors.accent, width: 24 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingBottom: 20 },
  backBtn: { flex: 1, padding: 16, borderRadius: 14, alignItems: 'center' },
  backText: { color: colors.textMuted, fontSize: 16, fontFamily: FONTS.bodySemiBold },
  nextBtn: { flex: 2, padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: colors.accent },
  nextText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bodySemiBold },
});
