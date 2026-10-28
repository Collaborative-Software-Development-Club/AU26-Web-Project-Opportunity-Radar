import { View, Text, Pressable } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { buttonColors } from "../../assets/colors";
type pressProps = {
  cat: string;
  index: number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  buttonState: string;
  setButtonState: React.Dispatch<React.SetStateAction<string>>;
};
const PillButton = ({
  cat,
  index,
  icon,
  buttonState,
  setButtonState,
}: pressProps) => {
  return (
    <Pressable
      className="min-h-10 shrink-0 flex-row gap-[7px] items-center justify-center rounded-full border-[0.5px] px-3 py-2"
      style={{
        borderColor: buttonColors[index].pressed,
        backgroundColor:
          buttonState === cat
            ? buttonColors[index].pressed
            : buttonColors[index].unpressed,
      }}
      onPress={() => setButtonState(cat)}
    >
      <Ionicons
        name={icon}
        size={17}
        color={buttonState === cat ? "#FFFFFF" : buttonColors[index].pressed}
      />
      <Text
        className={`text-[13px] font-semibold leading-4`}
        style={{
          color: buttonState === cat ? "#FFFFFF" : buttonColors[index].pressed,
        }}
      >
        {cat}
      </Text>
    </Pressable>
  );
};

export default PillButton;
