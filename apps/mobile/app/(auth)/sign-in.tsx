import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useSignIn } from "@clerk/expo";
import { Link } from "expo-router";
import { GoogleButton } from "../../src/components/google-button";

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);

  const busy = fetchStatus === "fetching";

  const onSignIn = async () => {
    const { error } = await signIn.password({ identifier: email, password });
    if (error) return;

    if (signIn.status === "complete") {
      await signIn.finalize();
    } else if (
      signIn.status === "needs_client_trust" ||
      signIn.status === "needs_second_factor"
    ) {
      await signIn.mfa.sendEmailCode();
      setNeedsCode(true);
    }
  };

  const onVerify = async () => {
    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) return;
    if (signIn.status === "complete") await signIn.finalize();
  };

  if (needsCode) {
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
      <Text style={styles.title}>Sign in to your account</Text>
      <GoogleButton />
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.fields.identifier && (
        <Text style={styles.error}>{errors.fields.identifier.message}</Text>
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
      <Button title="Sign in" onPress={onSignIn} disabled={busy} />
      <Link href="/sign-up">Don't have an account? Sign up</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 28, gap: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  error: { color: "crimson" },
});
