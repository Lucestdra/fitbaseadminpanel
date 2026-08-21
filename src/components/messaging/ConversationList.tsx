import { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SearchInput } from '@/components/ui/SearchInput';
import { ConversationListItem } from './ConversationListItem';
import { colors, spacing, typography, radii } from '@/theme';
import type { Conversation } from '@/types/inbox';

interface ConversationListProps {
  conversations: Conversation[];
  /**
   * How many threads are somebody's move, from the server's own counters.
   *
   * <b>Not `conversations.length`.</b> The list holds one page; the counter describes the inbox.
   * Printing the page size beside "Açık Konuşmalar" would tell a studio with two hundred open
   * threads that they have thirty.
   */
  openCount: number | null;
  status: 'loading' | 'ready' | 'error';
  activeConversationId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  openCount,
  status,
  activeConversationId,
  onSelect,
}: ConversationListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr');
    if (!query) return conversations;
    return conversations.filter(
      (conversation) =>
        conversation.contactName.toLocaleLowerCase('tr').includes(query) ||
        conversation.lastMessage.toLocaleLowerCase('tr').includes(query)
    );
  }, [conversations, search]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <SearchInput placeholder="Ara" value={search} onChangeText={setSearch} />
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Açık Konuşmalar</Text>
        </View>
        {openCount !== null && <Text style={styles.totalText}>Toplam: {openCount}</Text>}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {status === 'loading' && (
          <View style={styles.notice}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {status === 'error' && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Konuşmalar alınamadı. Bağlantını kontrol edip tekrar dene.
            </Text>
          </View>
        )}

        {/*
          An empty inbox is a real answer and it is the one a studio sees on the day they connect a
          channel — the version this replaces could never show it, because its eight threads were
          fixtures. Distinguished from a search that matched nothing, which is the studio's own
          doing and needs a different sentence.
        */}
        {status === 'ready' && conversations.length === 0 && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Henüz mesaj yok. Bağlı kanallarına gelen konuşmalar burada görünecek.
            </Text>
          </View>
        )}

        {status === 'ready' && conversations.length > 0 && filtered.length === 0 && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>Aramanla eşleşen konuşma yok.</Text>
          </View>
        )}

        {filtered.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onPress={() => onSelect(conversation.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  searchWrapper: {
    paddingHorizontal: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  headerPill: {
    backgroundColor: colors.mintLight,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  headerPillText: {
    ...typography.captionStrong,
    color: colors.primaryDark,
  },
  totalText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  list: {
    flex: 1,
  },
  notice: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  noticeText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
