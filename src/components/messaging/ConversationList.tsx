import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SearchInput } from '@/components/ui/SearchInput';
import { ConversationListItem } from './ConversationListItem';
import { colors, spacing, typography, radii } from '@/theme';
import type { Conversation } from '@/types/inbox';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeConversationId, onSelect }: ConversationListProps) {
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
        <Text style={styles.totalText}>Toplam: {conversations.length}</Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
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
});
