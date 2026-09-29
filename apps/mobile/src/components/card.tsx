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
    <View className="mt-3 min-h-[194px] flex-row flex-wrap content-start gap-x-[6px] gap-y-[10px] rounded-2xl border border-[#dedcd5] bg-white p-4 shadow-[0px_5px_18px_0px_rgba(28,41,36,0.1)]">
      <Ionicons name={"person-circle"} size={24} color="#ffffff" className="mb-[2px] h-[38px] w-[38px] overflow-hidden rounded-[11px] bg-[#4f9e9c] p-[7px]" />
      <Text className="w-full font-serif text-[18px] font-bold leading-[23px] text-[#182a27]">{name}</Text>
      <Text className="self-start rounded-xl bg-[#edf1fa] px-[9px] py-[6px] text-[10px] font-semibold leading-3 text-[#4c648f]">{type}</Text>
      <Text className="self-start rounded-xl bg-[#e0f3ec] px-[9px] py-[6px] text-[10px] font-semibold leading-3 text-[#13755f]">{paid ? `$${wage} per hour` : "Unpaid"}</Text>
    </View>
  );
};

export default Card;
