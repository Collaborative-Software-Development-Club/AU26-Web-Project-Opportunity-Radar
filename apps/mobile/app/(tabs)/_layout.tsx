import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Redirect, Slot, Tabs } from "expo-router";
import { SignOutButton } from "../../src/components/sign-out-button";
import { ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isSignedIn) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#137b77",
        //tabBarActiveBackgroundColor: "#EDEDED",
      }}
    >
      <Tabs.Screen
        name="discovery-page"
        options={{
          title: "Search",
          tabBarLabel: "Search",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "search-circle" : "search-circle-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarLabel: "Calendar",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar-number" : "calendar-number-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarLabel: "Notifications",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused
                  ? "notifications-circle"
                  : "notifications-circle-outline"
              }
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile-page"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
