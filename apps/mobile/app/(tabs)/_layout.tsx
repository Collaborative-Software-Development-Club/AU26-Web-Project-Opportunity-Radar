import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
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
