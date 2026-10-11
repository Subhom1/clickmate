import React, { useContext } from "react";
import { AuthContext, AuthProvider } from "./AuthContext";
import { RootLayout } from "./_layout";
import { Provider } from "jotai";
import { RootSiblingParent } from "react-native-root-siblings";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider>
          <AuthProvider>
            <RootSiblingParent>
              <AppContent />
            </RootSiblingParent>
          </AuthProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { user, platform } = useContext(AuthContext);

  return <RootLayout user={user} platform={platform} />;
}
