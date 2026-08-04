import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CatalogsProvider } from '@/context/CatalogsContext';
import { AuthProvider } from '@/context/AuthContext';
import { BootstrapGate } from '@/components/auth/BootstrapGate';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        {/*
          Inside AuthProvider and outside everything else: it asks the provider whether the
          session bootstrap has settled, and holds the rest of the tree until it has. Without it
          a cold start shows the sign-in screen for a beat to somebody who was signed in.
        */}
        <BootstrapGate>
          {/*
            No ProgramsProvider. Programmes are server state — a month's weeks and the record of
            passing them on — and the context that held them in memory could only ever describe the
            current session's edits.
          */}
          <CatalogsProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </CatalogsProvider>
        </BootstrapGate>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
