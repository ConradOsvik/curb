import { Button, Surface } from "heroui-native";
import { useCallback } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = useCallback(() => {
    authClient.signOut();
  }, []);

  return (
    <Container className="p-4">
      <View className="py-6 mb-4">
        <Text className="text-3xl font-semibold text-foreground tracking-tight">
          Curb
        </Text>
        <Text className="text-muted text-sm mt-1">Receipt management</Text>
      </View>

      {session?.user ? (
        <Surface variant="secondary" className="mb-4 p-4 rounded-lg">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-foreground font-medium">
                {session.user.name}
              </Text>
              <Text className="text-muted text-xs mt-0.5">
                {session.user.email}
              </Text>
            </View>
            <Button variant="destructive" size="sm" onPress={handleSignOut}>
              Sign Out
            </Button>
          </View>
        </Surface>
      ) : null}

      <Surface variant="secondary" className="p-4 rounded-lg">
        <Text className="text-foreground font-medium mb-2">Status</Text>
        <View className="flex-row items-center gap-2">
          <View
            className={`w-2 h-2 rounded-full ${isPending ? "bg-warning" : "bg-success"}`}
          />
          <Text className="text-muted text-xs">
            {isPending ? "Loading..." : "Connected"}
          </Text>
        </View>
      </Surface>
      {!session?.user && (
        <View className="mt-4 gap-4">
          <SignIn />
          <SignUp />
        </View>
      )}
    </Container>
  );
}
