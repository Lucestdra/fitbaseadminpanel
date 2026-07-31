/* eslint-disable react-hooks/refs -- PanResponder + Animated.ValueXY are inherently ref-based imperative APIs; this rule's render-purity assumptions don't apply to gesture handling. */
import { useRef, useState } from 'react';
import { Animated, PanResponder, View, Text, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii, cardShadow } from '@/theme';
import { useCatalogs } from '@/context/CatalogsContext';
import { getLeadSourceMeta, getStageMeta } from '@/utils/leads';
import type { Lead } from '@/types/leads';

interface LeadCardProps {
  lead: Lead;
  onDragStart: () => void;
  onDragMove: (lead: Lead, absoluteX: number, absoluteY: number) => void;
  onDragRelease: (lead: Lead, absoluteX: number, absoluteY: number) => void;
  onDragEnd: () => void;
  onPress: (lead: Lead) => void;
}

export function LeadCard({ lead, onDragStart, onDragMove, onDragRelease, onDragEnd, onPress }: LeadCardProps) {
  const { leadSources, stages } = useCatalogs();
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [dragging, setDragging] = useState(false);
  const showDateAtTop = lead.stage === 'deneme-planlandi';
  const source = getLeadSourceMeta(leadSources, lead.source);
  const stageTone = getStageMeta(stages, lead.stage).tone;

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
      accessibilityLabel={`${lead.name}, sürükleyerek aşama değiştir`}
    >
      <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>

      {showDateAtTop ? (
        <View style={styles.metaRow}>
          <AppIcon name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{lead.dateLabel}</Text>
        </View>
      ) : (
        <View style={styles.metaRow}>
          <AppIcon name={source.icon} size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{source.label}</Text>
        </View>
      )}

      <Text style={styles.detailText} numberOfLines={1}>İlgi: {lead.interest}</Text>
      <Text style={styles.detailText} numberOfLines={1}>Sorumlu: {lead.assignedTrainer}</Text>

      <View style={styles.footerRow}>
        <Badge label={lead.statusLabel} tone={stageTone} />
        {!showDateAtTop && <Text style={styles.dateText}>{lead.dateLabel}</Text>}
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
    marginTop: 4,
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
