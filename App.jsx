import React, { useContext, useState } from "react";
import { AuthContext, AuthProvider } from "./AuthContext";
import { RootLayout } from "./_layout";
import { RecoilRoot } from "recoil";
import { RootSiblingParent } from "react-native-root-siblings";
export default function App() {
  return (
    <RecoilRoot>
      <AuthProvider>
        <RootSiblingParent>
          <AppContent />
        </RootSiblingParent>
      </AuthProvider>
    </RecoilRoot>
  );
}

function AppContent() {
  const { user, platform } = useContext(AuthContext);

  return <RootLayout user={user} platform={platform} />;
}
