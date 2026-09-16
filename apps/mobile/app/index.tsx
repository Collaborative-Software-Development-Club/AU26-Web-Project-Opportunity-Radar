import { StyleSheet, Text, View } from 'react-native';
export default function Home() {
  return <View style={styles.container}><Text style={styles.title}>Opportunity Radar</Text>
    <Text>The React Native scaffold is running.</Text>
    <Text>Discovery, authentication, and saved opportunities are still placeholders.</Text></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 28, gap: 16, backgroundColor: '#f5f7f4' }, title: { fontSize: 32, fontWeight: '700', color: '#173b31' } });
