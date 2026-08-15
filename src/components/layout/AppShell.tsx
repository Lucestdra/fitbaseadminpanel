import { useEffect, useState, type ReactNode } from 'react';
import { View, ScrollView, Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StudioSidebar } from './StudioSidebar';
import { MobileHeader } from './MobileHeader';
import { ToastViewport } from '@/components/ui/Toast';
import { colors, spacing } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAuth } from '@/context/AuthContext';
import { canAccess } from '@/utils/permissions';

interface AppShellProps {
  activeId: string;
  children: ReactNode;
}

export function AppShell({ activeId, children }: AppShellProps) {
  const { isMobile, isTablet } = useResponsiveLayout();
  const [tabletCollapsed, setTabletCollapsed] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const { status, allowedNavIds, landingRoute } = useAuth();
  const allowed = canAccess(allowedNavIds, activeId);

  useEffect(() => {
    // 'loading' is neither signed in nor out: the bootstrap is still asking whether a stored
    // session resumes. Redirecting here would bounce a signed-in person to /giris on every cold
    // start, which is the flash the status exists to prevent.
    if (status === 'loading') return;

    if (status === 'signedOut') {
      router.replace('/giris' as never);
      return;
    }

    if (!allowed) {
      // Hiding the nav item is presentation; this is the client half of not showing a screen
      // somebody cannot use. The server half is the 403 its endpoints would return anyway.
      router.replace(landingRoute as never);
    }
  }, [status, allowed, landingRoute, router]);

  if (status !== 'signedIn' || !allowed) {
    return <View style={styles.blockedRoot} />;
  }

  if (isMobile) {
    return (
      <SafeAreaView style={styles.mobileRoot} edges={['top', 'bottom']}>
        <MobileHeader onMenuPress={() => setDrawerOpen(true)} />
        <ScrollView
          style={styles.mobileScroll}
          contentContainerStyle={styles.mobileContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        <Modal
          visible={drawerOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setDrawerOpen(false)}
        >
          <View style={styles.drawerRoot}>
            <View style={styles.drawerPanel}>
              <StudioSidebar activeId={activeId} onNavigate={() => setDrawerOpen(false)} />
            </View>
            <Pressable
              style={styles.drawerOverlay}
              accessibilityRole="button"
              accessibilityLabel="Menüyü kapat"
              onPress={() => setDrawerOpen(false)}
            />
          </View>
        </Modal>

        {/* Outside the ScrollView, deliberately. Inside it a notice is positioned against the page
            content, so on a long list it appears wherever the person has scrolled to — which is
            usually nowhere they can see. */}
        <ToastViewport />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.desktopRoot} edges={['top', 'bottom']}>
      <StudioSidebar
        activeId={activeId}
        collapsed={isTablet && tabletCollapsed}
        onToggleCollapse={isTablet ? () => setTabletCollapsed((prev) => !prev) : undefined}
      />
      <ScrollView
        style={styles.desktopScroll}
        contentContainerStyle={styles.desktopContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      <ToastViewport />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  blockedRoot: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.pageBackground,
  },
  desktopScroll: {
    flex: 1,
  },
  desktopContent: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxxl,
    gap: spacing.xxl,
  },
  mobileRoot: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  mobileScroll: {
    flex: 1,
  },
  mobileContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  drawerRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(32, 35, 33, 0.4)',
  },
  drawerPanel: {
    height: '100%',
  },
});
