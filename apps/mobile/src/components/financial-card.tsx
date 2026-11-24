//grant, fellowship, scholarship
import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Link } from "expo-router";
import { OpportunityView } from "@radar/contracts";

const FinancialCard = ({ opportunity }: { opportunity: OpportunityView }) => {
  const [saved, setSaved] = useState(false);
  return (
    <View className="mt-3 min-h-[194px] gap-[10px] rounded-2xl border border-[#dedcd5] bg-white p-4 shadow-[0px_5px_18px_0px_rgba(28,41,36,0.1)]">
      <View className="h-10 flex-row items-center gap-[10px]">
        <View className="h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#d99a60]">
          <Text className="text-[21px] font-semibold leading-[25px] text-white">
            ✦
          </Text>
        </View>
        <Text className="flex-1 text-[10px] font-semibold leading-3 text-[#66736d]">
          {opportunity.categories[0].name}
        </Text>
        <Pressable
          className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3f6f4]"
          onPress={() => setSaved(!saved)}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={18}
            color="#c87526"
          />
        </Pressable>
      </View>
      <Text className="font-lora-bold text-[18px] leading-[23px] text-[#182a27]">
        {opportunity.title}
      </Text>
      <View className="h-px bg-[#eaece8]" />
      <View className="h-8 flex-row items-center justify-between">
        <View className="gap-[2px]">
          <Text className="text-[9px] font-semibold uppercase leading-[11px] text-[#79817d]">
            Application deadline
          </Text>
          <Text className="text-[12px] font-semibold leading-[15px] text-[#344440]">
            {opportunity.applicationDeadline
              ? new Date(opportunity.applicationDeadline).toLocaleDateString()
              : "No deadline"}
          </Text>
        </View>
        <Link href="/">
          <Text className="text-[11px] font-semibold leading-[15px] text-[#c87526]">
            View details{" "}
          </Text>
          <Ionicons name={"arrow-forward"} size={15} color="#c87526" />
        </Link>
      </View>
    </View>
  );
};

export default FinancialCard;
