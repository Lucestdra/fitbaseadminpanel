import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { LeadColumn } from './LeadColumn';
import { LeadCardGhost } from './LeadCardGhost';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { toBadgeTone } from '@/types/settings';
import type { LeadBoardColumn, LeadListItem } from '@/api/leads';

interface LeadKanbanBoardProps {
  /**
   * Every stage, in `sortOrder`, including the empty ones — a board that hid empty columns would
   * rearrange itself as work moves and a studio would lose the place it drags to.
   */
  columns: LeadBoardColumn[];
  onMoveLead: (leadId: string, stageId: string) => void;
  onShowMore: () => void;
  onLeadPress: (lead: LeadListItem) => void;
}

const COLUMN_WIDTH = 260;
const COLUMN_STRIDE = COLUMN_WIDTH + spacing.lg;

export function LeadKanbanBoard({ columns, onMoveLead, onShowMore, onLeadPress }: LeadKanbanBoardProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollRectRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const columnLayoutsRef = useRef<Record<string, { x: number; width: number }>>({});
  const scrollXRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragGhost, setDragGhost] = useState<{ lead: LeadListItem; x: number; y: number } | null>(null);
  const [scrollX, setScrollX] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const contentWidth = columns.length * COLUMN_STRIDE;
  const canScrollLeft = scrollX > 4;
  const canScrollRight = scrollX + containerWidth < contentWidth - 4;

  const measureScrollView = useCallback(() => {
    (scrollViewRef.current as unknown as { measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void } | null)?.measureInWindow(
      (x, y, width, height) => {
        scrollRectRef.current = { x, y, width, height };
      }
    );
  }, []);

  useEffect(() => {
    measureScrollView();
    const subscription = Dimensions.addEventListener('change', measureScrollView);
    return () => subscription.remove();
  }, [measureScrollView]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollXRef.current = event.nativeEvent.contentOffset.x;
    setScrollX(event.nativeEvent.contentOffset.x);
  };

  const handleScrollLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
    measureScrollView();
  };

  const scrollByColumns = (direction: 1 | -1) => {
    const nextX = Math.max(0, Math.min(scrollXRef.current + direction * COLUMN_STRIDE * 2, contentWidth - containerWidth));
    scrollViewRef.current?.scrollTo({ x: nextX, animated: true });
  };

  const handleColumnLayout = (stageId: string) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    columnLayoutsRef.current[stageId] = { x, width };
  };

  const handleDragMove = (lead: LeadListItem, absoluteX: number, absoluteY: number) => {
    const rect = scrollRectRef.current;
    setDragGhost({ lead, x: absoluteX - rect.x, y: absoluteY - rect.y });
  };

  const handleDragEnd = () => {
    setDragGhost(null);
  };

  const handleDragRelease = (lead: LeadListItem, absoluteX: number, absoluteY: number) => {
    setIsDragging(false);
    const rect = scrollRectRef.current;
    if (absoluteY < rect.y - 40 || absoluteY > rect.y + rect.height + 40) return;

    const contentX = absoluteX - rect.x + scrollXRef.current;
    const targetEntry = Object.entries(columnLayoutsRef.current).find(
      ([, layout]) => contentX >= layout.x && contentX <= layout.x + layout.width
    );

    if (targetEntry) {
      const [stageId] = targetEntry;

      // Dropping a card back where it came from is something people do constantly. The server
      // treats it as a no-op too — a self-transition records a change that did not happen — but
      // not sending it saves a round trip and a spurious reload.
      if (stageId !== lead.stageId) {
        onMoveLead(lead.id, stageId);
      }
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.navRow}>
        <Text style={styles.navLabel}>{columns.length} aşama</Text>
        <View style={styles.navButtons}>
          <Pressable
            onPress={() => scrollByColumns(-1)}
            disabled={!canScrollLeft}
            accessibilityRole="button"
            accessibilityLabel="Sola kaydır"
            hitSlop={8}
            style={({ pressed }) => [
              styles.navButton,
              !canScrollLeft && styles.navButtonDisabled,
              pressed && canScrollLeft && styles.navButtonPressed,
            ]}
          >
            <AppIcon name="chevron-back" size={16} color={canScrollLeft ? colors.textPrimary : colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => scrollByColumns(1)}
            disabled={!canScrollRight}
            accessibilityRole="button"
            accessibilityLabel="Sağa kaydır"
            hitSlop={8}
            style={({ pressed }) => [
              styles.navButton,
              !canScrollRight && styles.navButtonDisabled,
              pressed && canScrollRight && styles.navButtonPressed,
            ]}
          >
            <AppIcon name="chevron-forward" size={16} color={canScrollRight ? colors.textPrimary : colors.textSecondary} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator
        scrollEnabled={!isDragging}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        onLayout={handleScrollLayout}
      >
        {columns.map((column) => (
          <View
            key={column.stageId}
            onLayout={handleColumnLayout(column.stageId)}
            style={styles.columnWrapper}
          >
            <LeadColumn
              column={column}
              onDragStart={() => setIsDragging(true)}
              onDragMove={handleDragMove}
              onDragRelease={handleDragRelease}
              onDragEnd={handleDragEnd}
              onShowMore={onShowMore}
              onLeadPress={onLeadPress}
            />
          </View>
        ))}
      </ScrollView>

      {dragGhost ? (
        <LeadCardGhost
          lead={dragGhost.lead}
          tone={toBadgeTone(
            columns.find((column) => column.stageId === dragGhost.lead.stageId)?.tone ?? 'neutral',
          )}
          x={dragGhost.x}
          y={dragGhost.y}
          width={COLUMN_WIDTH - 20}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  navButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  content: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingBottom: spacing.md,
    paddingRight: spacing.md,
  },
  columnWrapper: {
    width: COLUMN_WIDTH,
  },
});
