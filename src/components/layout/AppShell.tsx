import { useEffect, useState, type ReactNode } from 'react';
import { View, ScrollView, Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StudioSidebar } from './StudioSidebar';
import { MobileHeader } from './MobileHeader';
import { colors, spacing } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAuth } from '@/context/AuthContext';
import { canAccess, getLandingRoute } from '@/utils/permissions';

interface AppShellProps {
  activeId: string;
  children: ReactNode;
}

export function AppShell({ activeId, children }: AppShellProps) {
  const { isMobile, isTablet } = useResponsiveLayout();
  const [tabletCollapsed, setTabletCollapsed] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const allowed = user ? canAccess(user.role, activeId) : false;

  useEffect(() => {
    if (!user) {
      router.replace('/giris' as never);
      return;
    }
    if (!allowed) {
      router.replace(getLandingRoute(user.role) as never);
    }
  }, [user, allowed, router]);

  if (!user || !allowed) {
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
