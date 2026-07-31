import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { ListPageHeader } from '@/components/shared/ListPageHeader';
import { DistributionCard } from '@/components/shared/DistributionCard';
import { QuickActionsGrid } from '@/components/shared/QuickActionsGrid';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ClassTable } from '@/components/classes/ClassTable';
import { NewClassModal, type NewClassInput } from '@/components/classes/NewClassModal';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { spacing } from '@/theme';
import {
  classDefinitions as initialClasses,
  classKpis,
  classCategoryDistribution,
  classCategoryTotal,
  classQuickActions,
} from '@/mock/classes';
import type { ClassDefinition } from '@/types/classes';
import type { QuickAction } from '@/types/dashboard';

export default function ClassesScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState<ClassDefinition[]>(initialClasses);
  const [newClassModalVisible, setNewClassModalVisible] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const { message, visible, show } = useToast();

  const editingClass = classes.find((item) => item.id === editingClassId) ?? null;

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr');
    if (!query) return classes;
    return classes.filter(
      (item) =>
        item.name.toLocaleLowerCase('tr').includes(query) ||
        item.trainer.toLocaleLowerCase('tr').includes(query) ||
        item.category.toLocaleLowerCase('tr').includes(query)
    );
  }, [classes, search]);

  const handleSubmitClass = (input: NewClassInput) => {
    if (editingClassId) {
      setClasses((current) => current.map((item) => (item.id === editingClassId ? { ...item, ...input } : item)));
      show(`${input.name} dersi güncellendi.`);
      return;
    }
    const newClass: ClassDefinition = {
      id: `cls-${Date.now()}`,
      ...input,
      averageOccupancy: 0,
      status: 'aktif',
    };
    setClasses((current) => [newClass, ...current]);
    show(`${newClass.name} dersi eklendi.`);
  };

  const handleEditClass = (item: ClassDefinition) => {
    setEditingClassId(item.id);
    setNewClassModalVisible(true);
  };

  const handleCloseClassModal = () => {
    setNewClassModalVisible(false);
    setEditingClassId(null);
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.id === 'qa-new-class') {
      setNewClassModalVisible(true);
      return;
    }
    show(action.toastMessage);
  };

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '18.4%';

  const sidebar = (
    <>
      <DistributionCard title="Kategori Dağılımı" segments={classCategoryDistribution} total={classCategoryTotal} totalUnitLabel="seans" />
      <QuickActionsGrid actions={classQuickActions} onActionPress={handleQuickAction} />
    </>
  );

  return (
    <AppShell activeId="classes">
      <ListPageHeader
        title="Dersler"
        subtitle="Stüdyondaki tüm ders tiplerini ve programlarını yönet."
        searchPlaceholder="Ara (ders, eğitmen, kategori...)"
        searchValue={search}
        onSearchChange={setSearch}
        onFilterPress={() => show('Filtreleme seçenekleri yakında eklenecek.')}
        primaryActionLabel="Yeni Ders"
        primaryActionIcon="add"
        onPrimaryAction={() => {
          setEditingClassId(null);
          setNewClassModalVisible(true);
        }}
      />

      <View style={styles.kpiGrid}>
        {classKpis.map((item) => (
          <View key={item.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <KpiCard item={item} />
          </View>
        ))}
      </View>

      {isMobile || isTablet ? (
        <View style={styles.stack}>
          <ClassTable classes={filteredClasses} onEditClass={handleEditClass} />
          {sidebar}
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.mainCol}>
            <ClassTable classes={filteredClasses} onEditClass={handleEditClass} />
          </View>
          <View style={styles.sideCol}>{sidebar}</View>
        </View>
      )}

      <NewClassModal
        key={editingClassId ?? 'new'}
        visible={newClassModalVisible}
        editingClass={editingClass}
        onClose={handleCloseClassModal}
        onSubmit={handleSubmitClass}
      />

      <Toast message={message} visible={visible} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  kpiItem: {
    flexGrow: 1,
    minWidth: 150,
  },
  stack: {
    gap: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xxl,
    alignItems: 'flex-start',
  },
  mainCol: {
    flex: 68,
  },
  sideCol: {
    flex: 32,
    gap: spacing.xxl,
  },
});
