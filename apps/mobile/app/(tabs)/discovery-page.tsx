import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { mockData } from "../../src/mock/data";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../src/components/card";
import { useFonts, Lora_700Bold } from "@expo-google-fonts/lora";

const Discovery = () => {
  const [buttonState, setButtonState] = useState("");
  const [fontsLoaded] = useFonts({ Lora_700Bold });
  return (
    <>
      <SafeAreaView
        className="flex-1 bg-[#f5f2ec]"
        edges={["top", "left", "right"]}
      >
        <View className="bg-[#f5f2ec] px-[10px] pb-[6px] pt-[10px]">
          <Text
            className={`mb-[6px] text-[24px] leading-[30px] text-[#17201f] ${fontsLoaded ? "font-lora-bold" : "font-serif font-bold"}`}
          >
            Find Opportunities
          </Text>
          <View className="h-9 flex-row items-center gap-2 rounded-[5px] border border-[#dedcd5] bg-white px-[10px]">
            <Ionicons name={"search"} size={22} color="#85857d" />
            <TextInput
              placeholder="Search"
              placeholderTextColor="#85857d"
              className="h-full flex-1 py-0 text-[17px] leading-[22px] text-[#17201f]"
            />
            <Ionicons name="mic-outline" size={21} color="#85857d" />
          </View>
        </View>
        <View className="h-[50px] flex-row items-center justify-center gap-[3px] border border-[#c8c7c1] bg-[#ebeae5] px-[5px]">
          <Pressable
            className="h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#cac4d0] bg-[#17201f]"
            disabled={buttonState ? false : true}
          >
            <Ionicons name={"options"} size={24} color="white" />
          </Pressable>
          <Pressable
            className={`h-10 w-[105px] shrink flex flex-row gap-[7px] items-center justify-center rounded-full border-[0.5px] border-[#0c7777] px-2 transition-all duration-100 ${buttonState === "job" ? "bg-[#0c7777]" : "bg-[#e3f4f1]"}`}
            onPress={() => setButtonState("job")}
          >
            <Ionicons
              name={"briefcase-outline"}
              size={17}
              color={buttonState === "job" ? "#FFFFFF" : "#0c7777"}
            />
            <Text
              className={`text-[13px] font-semibold leading-4 ${buttonState === "job" ? "text-white" : "text-[#0c7777]"}`}
            >
              Job/Work
            </Text>
          </Pressable>
          <Pressable
            className={`h-10 w-[83px] shrink flex flex-row gap-[7px] items-center justify-center rounded-full border-[0.5px] border-[#7453a6] px-2 transition-all duration-100 ${buttonState === "event" ? "bg-[#7453a6]" : "bg-[#f0eaf8]"}`}
            onPress={() => setButtonState("event")}
          >
            <Ionicons
              name={"calendar-outline"}
              size={17}
              color={buttonState === "event" ? "#FFFFFF" : "#7453a6"}
            />
            <Text
              className={`text-[13px] font-semibold leading-4 ${buttonState === "event" ? "text-white" : "text-[#7453a6]"}`}
            >
              Event
            </Text>
          </Pressable>
          <Pressable
            className={`h-10 w-[133px] shrink flex flex-row gap-[7px] items-center justify-center rounded-full border-[0.5px] border-[#ca6d19] px-2 transition-all duration-100 ${buttonState === "financials" ? "bg-[#ca6d19]" : "bg-[#fff0df]"}`}
            onPress={() => setButtonState("financials")}
          >
            <Ionicons
              name={"wallet-outline"}
              size={17}
              color={buttonState === "financials" ? "#FFFFFF" : "#ca6d19"}
            />
            <Text
              className={`text-[13px] font-semibold leading-4 ${buttonState === "financials" ? "text-white" : "text-[#ca6d19]"}`}
            >
              Financial aid
            </Text>
          </Pressable>
        </View>
        <View className="flex-1 bg-[#f5f2ec] h-full">
          <FlatList
            ListHeaderComponent={
              <Text className="h-5 text-[14px] font-medium leading-5 tracking-[0.1px] text-black">
                Results
              </Text>
            }
            className={"flex-1 h-full"}
            contentContainerClassName="px-[10px] pb-4"
            data={
              buttonState === "job"
                ? mockData.work
                : buttonState === "event"
                  ? mockData.event
                  : buttonState === "financials"
                    ? mockData.financialAid
                    : []
            }
            renderItem={({ item }) => (
              <Card
                company={item.company}
                title={item.title}
                oppType={item.oppType}
                applType={item.applType}
                applField={item.applField}
                appDL={item.appDL}
                paid={item.paid}
                wage={item.wage}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View className="mt-6 items-center rounded-2xl border border-[#dedcd5] bg-white px-6 py-10">
                <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-[#e3f4f1]">
                  <Ionicons name="compass-outline" size={32} color="#0c7777" />
                </View>
                <Text
                  className={`text-center text-[20px] leading-7 text-[#182a27] ${fontsLoaded ? "font-lora-bold" : "font-serif font-bold"}`}
                >
                  Find your next opportunity
                </Text>
                <Text className="mt-3 max-w-[280px] text-center text-[14px] leading-[22px] text-[#66736d]">
                  Choose Job/Work, Event, or Financial aid above to start
                  exploring.
                </Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </>
  );
};

export default Discovery;
