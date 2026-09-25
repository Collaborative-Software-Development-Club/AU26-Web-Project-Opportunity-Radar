import { useSignUp } from "@clerk/expo";
import { Link } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { GoogleButton } from "../../src/components/google-button";

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);

  const busy = fetchStatus === "fetching";

  const onSignUp = async () => {
    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) return;
    await signUp.verifications.sendEmailCode();
    setPendingVerification(true);
  };

  const onVerify = async () => {
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) return;
    if (signUp.status === "complete") {
      await signUp.finalize();
    }
  };

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="6-digit code"
          keyboardType="number-pad"
        />
        <Button title="Verify" onPress={onVerify} disabled={busy} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <GoogleButton />
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.fields.emailAddress && (
        <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>
      )}
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      {errors.fields.password && (
        <Text style={styles.error}>{errors.fields.password.message}</Text>
      )}
      <Button title="Sign up" onPress={onSignUp} disabled={busy} />
      <Link href="/sign-in">Already have an account? Sign in</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 28, gap: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  error: { color: "crimson" },
});
