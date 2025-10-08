import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { Ref } from "react";
import { Pressable } from "react-native";

export const HeaderButton = ({
  onPress,
}: {
  onPress?: () => void;
  ref?: Ref<typeof Pressable | null>;
}) => (
  <Pressable
    className="mr-2 rounded-lg bg-secondary/50 p-2 active:bg-secondary"
    onPress={onPress}
  >
    {({ pressed }) => (
      <FontAwesome
        className="text-secondary-foreground"
        name="info-circle"
        size={20}
        style={{
          opacity: pressed ? 0.7 : 1,
        }}
      />
    )}
  </Pressable>
);
