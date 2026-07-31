import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CatalogsProvider } from '@/context/CatalogsContext';
import { CalendarProvider } from '@/context/CalendarContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProgramsProvider } from '@/context/ProgramsContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <CatalogsProvider>
          <CalendarProvider>
            <ProgramsProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </ProgramsProvider>
          </CalendarProvider>
        </CatalogsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
