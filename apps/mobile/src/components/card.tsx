import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Link } from "expo-router";
type cardProps = {
  company: string;
  title: string;
  oppType: string;
  applType: string;
  applField: string;
  appDL: string;
  paid: boolean;
  wage: number | null;
};

const Card = ({
  company,
  title,
  oppType,
  applType,
  applField,
  appDL,
  paid,
  wage,
}: cardProps) => {
  //use when implementing dark mode
  const colors = [
    { bg: "#e0f3ec", text: "#13755f" },
    { bg: "#edf1fa", text: "#4c648f" },
    { bg: "#fff0de", text: "#D67822" },
    { bg: "#F0EBF8", text: "#715493" },
  ];
  const [saved, setSaved] = useState(false);
  return (
    <View className="mt-3 min-h-[194px] gap-[10px] rounded-2xl border border-[#dedcd5] bg-white p-4 shadow-[0px_5px_18px_0px_rgba(28,41,36,0.1)]">
      <View className="h-10 flex-row items-center gap-[10px]">
        <View className="h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#4f9e9c]">
          <Text className="text-[21px] font-semibold leading-[25px] text-white">✦</Text>
        </View>
        <Text className="flex-1 text-[10px] font-semibold leading-3 text-[#66736d]">
          {company}
        </Text>
        <Pressable
          className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3f6f4]"
          onPress={() => setSaved(!saved)}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={18}
            color="#137b77"
          />
        </Pressable>
      </View>
      <Text className="font-lora-bold text-[18px] leading-[23px] text-[#182a27]">
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="h-6 grow-0"
        contentContainerClassName="items-start gap-[6px]"
      >
        <Text className="self-start rounded-xl bg-[#edf1fa] px-[9px] py-[6px] text-[10px] font-semibold leading-3 text-[#4c648f]">
          {oppType}
        </Text>
        <Text className="self-start rounded-xl bg-[#e0f3ec] px-[9px] py-[6px] text-[10px] font-semibold leading-3 text-[#13755f]">
          {paid ? `$${wage} per hour` : "Unpaid"}
        </Text>
        <Text className="self-start rounded-xl bg-[#edf1fa] px-[9px] py-[6px] text-[10px] font-semibold leading-3 text-[#4c648f]">
          {applType}
        </Text>
        <Text className="self-start rounded-xl bg-[#F0EBF8] px-[9px] py-[6px] text-[10px] font-semibold leading-3 text-[#715493]">
          {applField}
        </Text>
      </ScrollView>
      <View className="h-px bg-[#eaece8]" />
      <View className="h-8 flex-row items-center justify-between">
        <View className="gap-[2px]">
          <Text className="text-[9px] font-semibold uppercase leading-[11px] text-[#79817d]">
            Application deadline
          </Text>
          <Text className="text-[12px] font-semibold leading-[15px] text-[#344440]">
            {appDL}
          </Text>
        </View>
        <Link href="/" className="text-[11px] font-semibold leading-[15px] text-[#137b77]">
          View details <Ionicons name={"arrow-forward"} size={15} color="#137b77" />
        </Link>
      </View>
    </View>
  );
};

export default Card;
