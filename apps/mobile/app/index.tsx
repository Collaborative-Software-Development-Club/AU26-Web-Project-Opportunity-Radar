import { useAuth } from "@clerk/expo";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { SignOutButton } from "../src/components/sign-out-button";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    gap: 16,
    backgroundColor: "#f5f7f4",
  },
  title: { fontSize: 32, fontWeight: "700", color: "#173b31" },
});

export default function MainScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!isSignedIn) return <Redirect href="/sign-in" />;

  return (
    <View style={styles.container}>
      <SignOutButton />
      <Text style={styles.title}>Opportunity Radar</Text>
      <Text>The React Native scaffold is running.</Text>
      <Text>
        Discovery, authentication, and saved opportunities are still
        placeholders.
      </Text>
    </View>
  );
}
