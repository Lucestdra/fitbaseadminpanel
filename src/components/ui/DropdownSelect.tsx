import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii, cardShadow } from '@/theme';

export interface DropdownOption {
  id: string;
  label: string;
  meta?: string;
}

interface DropdownSelectProps {
  placeholder: string;
  options: DropdownOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  open: boolean;
  onToggle: () => void;
  clearLabel?: string;
  disabled?: boolean;
  /** Shown in place of the list when there is nothing to choose from. */
  emptyLabel?: string;
  /**
   * Widens the open panel past the trigger. For narrow triggers whose options are not — a dial-code
   * picker is 110pt wide and its rows say "🇹🇷 +90 Türkiye".
   */
  panelMinWidth?: number;
}

/** Where the open list is drawn, in window coordinates. */
interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Tall enough for roughly six rows; longer lists scroll inside. */
const MAX_LIST_HEIGHT = 264;

/** Kept clear of the viewport edge so the panel never sits flush against it. */
const VIEWPORT_MARGIN = 12;

/** The gap between the trigger and the panel. */
const OFFSET = 4;

/**
 * A select whose list is drawn in an overlay rather than inside the form.
 *
 * <b>The list used to be an absolutely positioned sibling</b>, which is why every screen reported
 * it as "transparent": positioned inside a `ScrollView`, it was clipped by the scroll container and
 * painted underneath whatever the form rendered after it, so the fields below showed through the
 * options. No amount of `zIndex` fixes that — a child cannot paint above an ancestor's clip.
 *
 * Drawing it in a `Modal` anchored to the measured trigger takes it out of the form's stacking and
 * clipping entirely. That also makes it usable inside the dialogs that scroll: the panel stays put
 * against the viewport instead of scrolling away with the field it belongs to.
 *
 * It flips above the trigger when the space below is too short, which is the case that made the
 * time picker unusable at the bottom of the new-session sheet.
 */
export function DropdownSelect({
  placeholder,
  options,
  selectedId,
  onSelect,
  open,
  onToggle,
  clearLabel,
  disabled = false,
  emptyLabel,
  panelMinWidth,
}: DropdownSelectProps) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const anchorRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const selected = options.find((option) => option.id === selectedId) ?? null;

  const measure = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      // A collapsed measurement means the trigger is not laid out yet — keeping the previous
      // anchor beats drawing the panel in the top-left corner for a frame.
      if (width > 0 || height > 0) setAnchor({ x, y, width, height });
    });
  }, []);

  useEffect(() => {
    if (open) measure();
  }, [open, measure]);

  // Nothing to open. Reporting it on the trigger is better than a panel with one dead row in it.
  const isEmpty = options.length === 0 && !clearLabel;

  const spaceBelow = anchor ? windowHeight - (anchor.y + anchor.height) - VIEWPORT_MARGIN : 0;
  const spaceAbove = anchor ? anchor.y - VIEWPORT_MARGIN : 0;
  const dropUp = anchor !== null && spaceBelow < 160 && spaceAbove > spaceBelow;
  const available = dropUp ? spaceAbove : spaceBelow;
  const maxHeight = Math.max(120, Math.min(MAX_LIST_HEIGHT, available - OFFSET));

  // Widened panels are pulled back inside the viewport rather than overflowing it, which a picker
  // on the right-hand column of a two-up row would otherwise do.
  const panelWidth = anchor ? Math.max(anchor.width, panelMinWidth ?? 0) : 0;
  const panelLeft = anchor
    ? Math.max(VIEWPORT_MARGIN, Math.min(anchor.x, windowWidth - panelWidth - VIEWPORT_MARGIN))
    : 0;

  return (
    <View style={styles.wrapper}>
      <View ref={anchorRef} collapsable={false} onLayout={measure}>
        <Pressable
          onPress={() => {
            if (disabled) return;
            measure();
            onToggle();
          }}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={placeholder}
          accessibilityState={{ expanded: open, disabled }}
          style={({ pressed }) => [
            styles.trigger,
            pressed && !disabled && styles.triggerPressed,
            open && styles.triggerOpen,
            disabled && styles.triggerDisabled,
          ]}
        >
          <Text style={[styles.triggerText, !selected && styles.placeholder]} numberOfLines={1}>
            {selected ? selected.label : placeholder}
          </Text>
          <AppIcon
            name={open ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      {isEmpty && emptyLabel ? <Text style={styles.emptyHint}>{emptyLabel}</Text> : null}

      <Modal
        visible={open && anchor !== null}
        transparent
        animationType="none"
        onRequestClose={onToggle}
      >
        {/* Dismisses on any press outside the panel, including a press on another field — which is
            what people expect and what the old inline list could not do. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel="Listeyi kapat"
        />

        {anchor ? (
          <View
            accessibilityViewIsModal
            style={[
              styles.panel,
              {
                left: panelLeft,
                width: panelWidth,
                maxHeight,
                ...(dropUp
                  ? { bottom: windowHeight - anchor.y + OFFSET }
                  : { top: anchor.y + anchor.height + OFFSET }),
              },
            ]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              contentContainerStyle={styles.listContent}
            >
              {clearLabel ? (
                <Pressable
                  onPress={() => onSelect(null)}
                  accessibilityRole="button"
                  accessibilityLabel={clearLabel}
                  style={({ pressed }) => [
                    styles.item,
                    selectedId === null && styles.itemActive,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <Text style={[styles.itemName, selectedId === null && styles.itemNameActive]}>
                    {clearLabel}
                  </Text>
                </Pressable>
              ) : null}

              {options.map((option) => {
                const active = option.id === selectedId;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => onSelect(option.id)}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => [
                      styles.item,
                      active && styles.itemActive,
                      pressed && styles.itemPressed,
                    ]}
                  >
                    <Text
                      style={[styles.itemName, active && styles.itemNameActive]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                    {option.meta ? (
                      <Text style={styles.itemMeta} numberOfLines={1}>
                        {option.meta}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  triggerPressed: {
    backgroundColor: colors.pageBackground,
  },
  triggerOpen: {
    borderColor: colors.primary,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  panel: {
    position: 'absolute',
    // Opaque, and stated here rather than inherited. The whole reported symptom was this surface
    // letting the form behind it show through.
    backgroundColor: colors.cardBackground,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  item: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.cardBackground,
  },
  itemPressed: {
    backgroundColor: colors.pageBackground,
  },
  itemActive: {
    backgroundColor: colors.mintLight,
  },
  itemName: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  itemNameActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
