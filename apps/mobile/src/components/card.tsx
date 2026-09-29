import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
type cardProps = {
  name: string;
  type: string;
  paid: boolean;
  wage: number | null;
};
const Card = ({ name, type, paid, wage }: cardProps) => {
  return (
    <View className="mt-4 min-h-[179px] rounded-lg border border-[#d9d9d9] bg-white px-[23px] pb-[13px] pt-[23px] shadow-md">
      <Ionicons name={"person-circle"} size={24} color="#ffffff" style={{ width: 56, height: 48, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, backgroundColor: "#852221" }} />
      <Text className="mb-2 text-[24px] font-semibold leading-[29px] tracking-[-0.7px] text-[#1e1e1e]">{name}</Text>
      <Text className="text-[20px] leading-6 text-[#757575]">{type}</Text>
      <Text className="text-[20px] leading-6 text-[#757575]">{paid ? `$${wage} per hour` : "Unpaid"}</Text>
    </View>
  );
};

export default Card;
