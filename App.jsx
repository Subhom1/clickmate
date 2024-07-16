import React, { useContext } from "react";
import { AuthContext, AuthProvider } from "./AuthContext";
import RootLayout from "./_layout";
import { Platform } from "react-native";

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user } = useContext(AuthContext);
  return <RootLayout user={user} />;
}
