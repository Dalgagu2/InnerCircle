import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Inner Circle</Text>
        <Text style={styles.subtitle}>FRIENDSHIP TRACKER</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>TOTAL</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#E87C36' }]}>0</Text>
          <Text style={styles.statLabel}>OVERDUE</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#E8364F' }]}>0</Text>
          <Text style={styles.statLabel}>CRITICAL</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Contacts</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>😈</Text>
          <Text style={styles.emptyText}>No contacts yet</Text>
          <Text style={styles.emptyHint}>Add someone to start tracking</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => alert('Add contact coming soon!')}>
        <Text style={styles.addButtonText}>+ Add Contact</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D0D12',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E8E6E1',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B6760',
    letterSpacing: 2,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E8E6E1',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B6760',
    letterSpacing: 1,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E6E1',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#E8E6E1',
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 13,
    color: '#6B6760',
    marginTop: 4,
  },
  addButton: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#dc6e6ee9',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  });