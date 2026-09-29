import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { mockData } from "../../src/mock/data";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../src/components/card";

const Discovery = () => {
  const [buttonState, setButtonState] = useState("");
  return (
    <>
      <SafeAreaView className="flex-1 bg-white">
        <View className="bg-[#ff383c] px-2 pt-[27px]">
          <Text className="mx-[11px] mb-[7px] text-center font-mono text-[17px] uppercase leading-[22px] tracking-[2px] text-[#fff4f4]">
            Find Jobs, Events, Scholarships and More!
          </Text>
          <View className="h-[55px] flex-row items-center gap-2 rounded-full border border-[#ffc4c5] bg-[#f99b9e] px-[14px]">
            <Ionicons name={"search"} size={24} color="black" />
            <TextInput className="h-full flex-1 py-0 text-[17px] text-black" />
          </View>
        </View>
        <View className="h-[52px] flex-row items-center justify-center gap-[3px] bg-[#e8e8e8] px-[5px]">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full border border-[#cac4d0] bg-[#e8e8e8] shadow-sm"
            disabled={buttonState ? false : true}
          >
            <Ionicons name={"filter"} size={24} color="black" />
          </Pressable>
          <Pressable
            className={`h-10 w-[98px] max-w-[27%] items-center justify-center rounded-full border border-[#cac4d0] shadow-sm transition-all duration-100 ${buttonState === "job" ? "bg-[#49454f]" : "bg-[#e8e8e8]"}`}
            onPress={() => setButtonState("job")}
          >
            <Text
              className={`text-[14px] font-medium ${buttonState === "job" ? "text-[#e8e8e8]" : "text-[#49454f]"}`}
            >
              Job/Work
            </Text>
          </Pressable>
          <Pressable
            className={`h-10 w-[70px] max-w-[19%] items-center justify-center rounded-full border border-[#cac4d0] shadow-sm transition-all duration-100 ${buttonState === "event" ? "bg-[#49454f]" : "bg-[#e8e8e8]"}`}
            onPress={() => setButtonState("event")}
          >
            <Text
              className={`text-[14px] font-medium ${buttonState === "event" ? "text-[#e8e8e8]" : "text-[#49454f]"}`}
            >
              Event
            </Text>
          </Pressable>
          <Pressable
            className={`h-10 w-[116px] max-w-[32%] items-center justify-center rounded-full border border-[#cac4d0] shadow-sm transition-all duration-100 ${buttonState === "financials" ? "bg-[#49454f]" : "bg-[#e8e8e8]"}`}
            onPress={() => setButtonState("financials")}
          >
            <Text
              className={`text-[14px] font-medium ${buttonState === "financials" ? "text-[#e8e8e8]" : "text-[#49454f]"}`}
            >
              Financial Aid
            </Text>
          </Pressable>
        </View>
        <View className="flex-1 bg-white">
          <FlatList
            ListHeaderComponent={
              <Text className="h-[34px] pt-[7px] text-[14px] font-medium leading-5 tracking-[0.1px] text-black">
                {mockData.length} results
              </Text>
            }
            className={"flex-1"}
            contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 16 }}
            data={mockData}
            renderItem={({ item }) => (
              <Card
                name={item.name}
                type={item.type}
                paid={item.paid}
                wage={item.wage}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      </SafeAreaView>
    </>
  );
};

export default Discovery;
