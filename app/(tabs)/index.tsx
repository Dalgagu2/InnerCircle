import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inner Circle</Text>
      <Text style={styles.subtitle}>Friendship Tracker</Text>
      <Text style={styles.body}>I will not be denied.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D12',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E8E6E1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#E8364F',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  body: {
    fontSize: 16,
    color: '#6B6760',
  },
});