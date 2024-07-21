import React, { useContext, useState } from "react";
import { AuthContext, AuthProvider } from "./AuthContext";
import {RootLayout} from "./_layout";

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, platform } = useContext(AuthContext);

  return <RootLayout user={user} platform={platform} />;
}
