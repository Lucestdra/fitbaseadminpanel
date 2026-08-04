/* eslint-disable react-hooks/refs -- PanResponder + Animated.ValueXY are inherently ref-based imperative APIs; this rule's render-purity assumptions don't apply to gesture handling. */
import { useRef, useState } from 'react';
import { Animated, PanResponder, View, Text, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { colors, spacing, typography, radii, cardShadow } from '@/theme';
import { useCatalogs } from '@/context/CatalogsContext';
import { toIconName } from '@/types/settings';
import { formatRelativeDateTimeLabel } from '@/utils/date';
import type { LeadListItem } from '@/api/leads';

interface LeadCardProps {
  lead: LeadListItem;
  tone: BadgeTone;
  onDragStart: () => void;
  onDragMove: (lead: LeadListItem, absoluteX: number, absoluteY: number) => void;
  onDragRelease: (lead: LeadListItem, absoluteX: number, absoluteY: number) => void;
  onDragEnd: () => void;
  onPress: (lead: LeadListItem) => void;
}

/**
 * One lead on the pipeline board.
 *
 * <b>The names arrive resolved from the server</b> — `sourceName`, `interestName`,
 * `assignedStaffName`, `statusLabel`. Only the source's icon is looked up locally, because an icon
 * is a display choice the catalog owns and no other module needs. The panel resolved every one of
 * them client-side against a mock catalog, which is why a lead whose source had been deleted
 * rendered its own raw id.
 *
 * <b>`isOverdue` is not computed here.</b> It arrives decided against the studio's clock rather
 * than the device's — an owner checking the board from London would otherwise see today's
 * callbacks as already overdue for three hours out of every twenty-four.
 */
export function LeadCard({
  lead,
  tone,
  onDragStart,
  onDragMove,
  onDragRelease,
  onDragEnd,
  onPress,
}: LeadCardProps) {
  const { leadSources } = useCatalogs();
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [dragging, setDragging] = useState(false);

  const source = leadSources.find((entry) => entry.id === lead.sourceId);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        setDragging(true);
        onDragStart();
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_evt, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        onDragMove(lead, gestureState.moveX, gestureState.moveY);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        setDragging(false);
        onDragEnd();
        const isTap = Math.abs(gestureState.dx) < 4 && Math.abs(gestureState.dy) < 4;
        if (isTap) {
          onPress(lead);
        } else {
          onDragRelease(lead, gestureState.moveX, gestureState.moveY);
        }
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 8 }).start();
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        onDragEnd();
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 8 }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.card,
        dragging && styles.cardDragging,
        { transform: pan.getTranslateTransform(), zIndex: dragging ? 20 : 1 },
      ]}
      accessibilityRole="none"
      accessibilityLabel={`${lead.fullName}, sürükleyerek aşama değiştir`}
    >
      <Text style={styles.name} numberOfLines={1}>{lead.fullName}</Text>

      {source ? (
        <View style={styles.metaRow}>
          <AppIcon name={toIconName(source.icon)} size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{lead.sourceName ?? source.label}</Text>
        </View>
      ) : null}

      <Text style={styles.detailText} numberOfLines={1}>
        İlgi: {lead.interestName ?? '—'}
      </Text>
      <Text style={styles.detailText} numberOfLines={1}>
        {/*
          Null is a real state and says so. An unassigned lead is the one that quietly goes cold,
          which is why the counters above the board count them separately.
        */}
        Sorumlu: {lead.assignedStaffName ?? 'Atanmadı'}
      </Text>

      <View style={styles.footerRow}>
        <Badge label={lead.statusLabel} tone={tone} />
        {lead.nextActionAt ? (
          <View style={styles.metaRow}>
            <AppIcon
              name={lead.isOverdue ? 'alert-circle-outline' : 'time-outline'}
              size={12}
              color={lead.isOverdue ? colors.critical : colors.textSecondary}
            />
            <Text style={[styles.dateText, lead.isOverdue && styles.overdueText]}>
              {formatRelativeDateTimeLabel(new Date(lead.nextActionAt))}
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
    userSelect: 'none',
    cursor: 'pointer',
    ...cardShadow,
  },
  cardDragging: {
    borderColor: colors.primary,
    opacity: 0.35,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: 4,
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  overdueText: {
    color: colors.critical,
  },
});
