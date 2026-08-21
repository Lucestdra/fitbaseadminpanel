import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/ui/AppIcon';
import { Avatar } from '@/components/ui/Avatar';
import { LogoMark } from '@/components/ui/LogoMark';
import { UserProfileModal } from '@/components/layout/UserProfileModal';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import * as sessionApi from '@/api/session';
import { canAccess } from '@/utils/permissions';
import { colors, radii, spacing, typography } from '@/theme';
import { navItems } from '@/config/navigation';
import type { NavItem } from '@/types/navigation';

interface StudioSidebarProps {
  activeId: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}

function SidebarNavItem({
  item,
  isActive,
  collapsed,
  onPress,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onPress: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        styles.navItem,
        collapsed && styles.navItemCollapsed,
        isHovered && !isActive && styles.navItemHovered,
        isActive && styles.navItemActive,
        pressed && styles.navItemPressed,
      ]}
    >
      <AppIcon name={item.icon} size={19} color={isActive ? colors.primaryDark : colors.textSecondary} />
      {!collapsed && (
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]} numberOfLines={1}>
          {item.label}
        </Text>
      )}
    </Pressable>
  );
}

export function StudioSidebar({ activeId, collapsed = false, onNavigate, onToggleCollapse }: StudioSidebarProps) {
  const router = useRouter();
  const { show } = useToast();
  const { user, studioName, studioAddress, roleLabel, allowedNavIds, signOut, refresh } = useAuth();

  /**
   * Saves the caller's own name and re-reads the session.
   *
   * The refresh is what puts the new name in the sidebar and everywhere else that reads it.
   * Patching `user` locally would leave the avatar initials, the sidebar and `/me` disagreeing
   * until the next reload — which is the shape of the bug this whole change removes.
   */
  const handleProfileSave = async (fullName: string) => {
    await sessionApi.updateMyProfile({ fullName, phoneNumber: null });
    await refresh();
    show('Profilin güncellendi.');
  };
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  if (!user) return null;

  // The server's list, in the server's order. The panel used to hold its own role-to-screen map,
  // which could disagree with what the API would actually allow — and a disagreement in that
  // direction is a screen that renders and then fails every call it makes.
  const visibleNavItems = navItems.filter((item) => canAccess(allowedNavIds, item.id));

  const handleSignOut = () => {
    signOut();
    router.replace('/giris' as never);
  };

  return (
    <View style={[styles.container, collapsed && styles.containerCollapsed]}>
      <View style={styles.logoRow}>
        <View style={styles.logoGroup}>
          <LogoMark size={28} />
          {!collapsed && <Text style={styles.logoText}>fitbase</Text>}
        </View>
        {onToggleCollapse && (
          <Pressable
            onPress={onToggleCollapse}
            accessibilityRole="button"
            accessibilityLabel={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
            hitSlop={8}
            style={({ pressed }) => [styles.collapseButton, pressed && styles.collapseButtonPressed]}
          >
            <AppIcon
              name={collapsed ? 'chevron-forward' : 'chevron-back'}
              size={14}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {/*
        <b>A ScrollView, and it is what stops the menu from printing itself over the footer.</b>
        This was a plain View with `flex: 1`, which resolves to whatever height is left after the
        logo and the footer — but its children carry `minHeight: 44` and do not shrink, and a View
        on React Native Web overflows visibly. So on a short window (a laptop with the browser
        chrome open, or a tablet in landscape) the last few items were drawn *on top of* the studio
        card and the user card rather than being clipped or scrolled.

        Scrolling rather than clipping, because the items that overflow are real destinations —
        "Ayarlar" is the last one in the list and hiding it is not better than overlapping it. The
        footer stays pinned: signing out and switching studio must not require scrolling past ten
        menu entries to reach.
      */}
      <ScrollView
        style={styles.nav}
        contentContainerStyle={[styles.navContent, collapsed && styles.navContentCollapsed]}
        showsVerticalScrollIndicator={false}
      >
        {visibleNavItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={item.id === activeId}
            collapsed={collapsed}
            onPress={() => {
              router.replace(item.href as never);
              onNavigate?.();
            }}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerCard}>
          <View style={styles.studioIcon}>
            <AppIcon name="business-outline" size={16} color={colors.primaryDark} />
          </View>
          {!collapsed && (
            <View style={styles.footerTextGroup}>
              <Text style={styles.footerTitle} numberOfLines={1}>{studioName}</Text>
              {/*
                Rendered only when the studio has entered one. The previous version printed a
                hard-coded city under every studio's name; a blank line is the honest answer for a
                studio that has not filled in its address, and the placeholder was not.
              */}
              {studioAddress.length > 0 && (
                <Text style={styles.footerSubtitle} numberOfLines={1}>{studioAddress}</Text>
              )}
            </View>
          )}
        </View>

        <Pressable
          onPress={() => setProfileModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Kullanıcı: ${user.name}, ${roleLabel}`}
          style={({ pressed }) => [styles.footerCard, pressed && styles.footerCardPressed]}
        >
          <Avatar initials={user.avatarInitials} size={32} />
          {!collapsed && (
            <View style={styles.footerTextGroup}>
              <Text style={styles.footerTitle} numberOfLines={1}>{user.name}</Text>
              <Text style={styles.footerSubtitle} numberOfLines={1}>{roleLabel}</Text>
            </View>
          )}
          {!collapsed && <AppIcon name="chevron-down" size={14} color={colors.textSecondary} />}
        </Pressable>

        <Pressable
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Çıkış yap"
          style={({ pressed }) => [styles.logoutRow, collapsed && styles.logoutRowCollapsed, pressed && styles.logoutRowPressed]}
        >
          <AppIcon name="log-out-outline" size={18} color={colors.critical} />
          {!collapsed && <Text style={styles.logoutLabel}>Çıkış</Text>}
        </Pressable>
      </View>

      <UserProfileModal
        visible={profileModalVisible}
        user={user}
        roleLabel={roleLabel}
        onClose={() => setProfileModalVisible(false)}
        onSave={handleProfileSave}
      />

    </View>
  );
}

const SIDEBAR_WIDTH = 238;
const SIDEBAR_WIDTH_COLLAPSED = 76;

const styles = StyleSheet.create({
  container: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.cardBackground,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    height: '100%',

    // The backstop. The nav scrolls, so nothing should reach this — but a View that overflows its
    // parent on web paints outside it silently, and one sentence here is cheaper than finding out
    // from a screenshot which child grew.
    overflow: 'hidden',
  },
  containerCollapsed: {
    width: SIDEBAR_WIDTH_COLLAPSED,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xxl,
    width: '100%',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  collapseButton: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapseButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  nav: {
    flex: 1,

    // On the ScrollView itself, not its content: `flex: 1` here is what makes the list take the
    // space between the logo and the footer and stop there.
    flexBasis: 0,
  },
  navContent: {
    gap: spacing.xs,

    // So a list shorter than the space available still sits at the top rather than stretching.
    flexGrow: 0,
  },
  navContentCollapsed: {
    alignItems: 'center',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  navItemCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
    width: 44,
  },
  navItemHovered: {
    backgroundColor: colors.pageBackground,
  },
  navItemPressed: {
    backgroundColor: colors.mintLight,
  },
  navItemActive: {
    backgroundColor: colors.mintLight,
  },
  navLabel: {
    ...typography.navItem,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  navLabelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  footer: {
    gap: spacing.sm,

    // Never squeezed. Without this the footer is the flex child that gives way when the window is
    // short, and the studio card, the user card and "Çıkış" collapse into each other — which is
    // the same overlap the nav had, moved one box down.
    flexShrink: 0,

    // Separates the pinned footer from a nav list that may be scrolled right up against it. No
    // rule: the two cards already carry their own borders, and a divider drawn here would have to
    // stretch in the expanded sidebar and centre in the collapsed one — two behaviours for a line
    // that the cards make unnecessary.
    marginTop: spacing.md,
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerCardPressed: {
    backgroundColor: colors.pageBackground,
  },
  studioIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTextGroup: {
    flex: 1,
    gap: 2,
  },
  footerTitle: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  footerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  logoutRowCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
    width: 44,
    alignSelf: 'center',
  },
  logoutRowPressed: {
    backgroundColor: '#FCE8E8',
  },
  logoutLabel: {
    ...typography.navItem,
    color: colors.critical,
  },
});
