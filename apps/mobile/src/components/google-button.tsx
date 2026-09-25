import { useSSO } from "@clerk/expo/experimental";
import * as WebBrowser from "expo-web-browser";
import { Button } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export function GoogleButton() {
  const { startSSOFlow } = useSSO();

  const onPress = async () => {
    const { createdSessionId, signUp } = await startSSOFlow({
      strategy: "oauth_google",
    });
    if (createdSessionId) return;
  };

  return <Button title="Continue with Google" onPress={onPress} />;
}
