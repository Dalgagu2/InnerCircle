import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, ActivityIndicator, Switch,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Contact } from '../constants/types';
import { scanCalendarForMatches, applyCalendarMatches } from '../utils/calendar';

interface CalendarSyncModalProps {
  visible: boolean;
  onClose: () => void;
  contacts: Contact[];
  onApply: (updatedContacts: Contact[]) => void;
}

interface MatchDisplay {
  contactId: string;
  contactName: string;
  eventTitle: string;
  eventDate: string;
  matchType: 'attendee' | 'title';
  accepted: boolean;
}

export default function CalendarSyncModal({ visible, onClose, contacts, onApply }: CalendarSyncModalProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchDisplay[]>([]);
  const [scanned, setScanned] = useState(false);
  const [daysBack, setDaysBack] = useState(30);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setMatches([]);
    }
  }, [visible]);

  const runScan = async () => {
    setLoading(true);
    try {
      const rawMatches = await scanCalendarForMatches(contacts, daysBack);
      setMatches(rawMatches.map(m => ({ ...m, accepted: true })));
      setScanned(true);
    } catch (error) {
      console.error('Calendar scan error:', error);
    }
    setLoading(false);
  };

  const toggleMatch = (contactId: string) => {
    setMatches(prev => prev.map(m =>
      m.contactId === contactId ? { ...m, accepted: !m.accepted } : m
    ));
  };

  const handleApply = () => {
    const acceptedMatches = matches.filter(m => m.accepted);
    const { updatedContacts } = applyCalendarMatches(contacts, acceptedMatches);
    onApply(updatedContacts);
    onClose();
  };

  const acceptedCount = matches.filter(m => m.accepted).length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.content}>

          <Text style={styles.title}>📅 Calendar Sync</Text>
          <Text style={styles.subtitle}>
            Scan your calendar to find events with your contacts and auto-update their last interaction date.
          </Text>

          {!scanned && !loading && (
            <>
              {/* Range selector */}
              <Text style={styles.label}>SCAN RANGE</Text>
              <View style={styles.rangeRow}>
                {[7, 14, 30, 60, 90].map(d => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDaysBack(d)}
                    style={[styles.rangeChip, daysBack === d && styles.rangeChipActive]}
                  >
                    <Text style={[styles.rangeChipText, daysBack === d && styles.rangeChipTextActive]}>
                      {d}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.scanBtn} onPress={runScan}>
                <Text style={styles.scanBtnText}>Scan Last {daysBack} Days</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Scanning your calendars...</Text>
              <Text style={styles.loadingHint}>Checking the last {daysBack} days of events</Text>
            </View>
          )}

          {scanned && !loading && (
            <>
              {matches.length === 0 ? (
                <View style={styles.centered}>
                  <Text style={styles.emptyEmoji}>📭</Text>
                  <Text style={styles.emptyText}>No matches found</Text>
                  <Text style={styles.emptyHint}>
                    No calendar events matched your contacts in the last {daysBack} days. Try a longer range or make sure your calendars are synced.
                  </Text>
                  <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.resultCount}>
                    Found {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                  </Text>

                  <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                    {matches.map(match => (
                      <View key={match.contactId} style={[styles.matchCard, !match.accepted && styles.matchCardDisabled]}>
                        <View style={styles.matchInfo}>
                          <Text style={styles.matchName}>{match.contactName}</Text>
                          <Text style={styles.matchEvent}>
                            {match.matchType === 'attendee' ? '👤' : '📝'} {match.eventTitle}
                          </Text>
                          <Text style={styles.matchDate}>{match.eventDate}</Text>
                        </View>
                        <Switch
                          value={match.accepted}
                          onValueChange={() => toggleMatch(match.contactId)}
                          trackColor={{ false: '#333', true: COLORS.accent + '80' }}
                          thumbColor={match.accepted ? COLORS.accent : '#666'}
                        />
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.bottomButtons}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.applyBtn, acceptedCount === 0 && { opacity: 0.4 }]}
                      onPress={handleApply}
                      disabled={acceptedCount === 0}
                    >
                      <Text style={styles.applyBtnText}>
                        Update {acceptedCount} {acceptedCount === 1 ? 'Contact' : 'Contacts'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  content: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36, maxHeight: '88%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderBottomWidth: 0,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: 20 },
  label: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, marginBottom: 8 },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  rangeChip: {
    flex: 1, padding: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'transparent',
  },
  rangeChipActive: { backgroundColor: COLORS.accent + '18', borderColor: COLORS.accent + '50' },
  rangeChipText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  rangeChipTextActive: { color: COLORS.accent },
  scanBtn: { padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: COLORS.accent, marginBottom: 10 },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  closeBtn: {
    padding: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  closeBtnText: { color: COLORS.textMuted, fontSize: 15, fontWeight: '600' },
  centered: { alignItems: 'center', paddingVertical: 30 },
  loadingText: { color: COLORS.text, marginTop: 14, fontSize: 15, fontWeight: '500' },
  loadingHint: { color: COLORS.textMuted, marginTop: 4, fontSize: 13 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  emptyHint: { fontSize: 13, color: COLORS.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 10 },
  resultCount: { fontSize: 14, color: COLORS.text, fontWeight: '600', marginBottom: 12 },
  list: { maxHeight: 350, marginBottom: 14 },
  matchCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, marginBottom: 6, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  matchCardDisabled: { opacity: 0.4 },
  matchInfo: { flex: 1, marginRight: 12 },
  matchName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  matchEvent: { fontSize: 13, color: COLORS.textMuted, marginTop: 3 },
  matchDate: { fontSize: 12, color: COLORS.accent, marginTop: 2, fontWeight: '500' },
  bottomButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtnText: { color: COLORS.textMuted, fontSize: 15, fontWeight: '600' },
  applyBtn: { flex: 2, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#4ADE80' },
  applyBtnText: { color: '#0D0D12', fontSize: 15, fontWeight: 'bold' },
});
