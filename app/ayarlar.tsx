import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { StudioProfileCard } from '@/components/settings/StudioProfileCard';
import { TaxBillingCard } from '@/components/settings/TaxBillingCard';
import { SubscriptionCard } from '@/components/settings/SubscriptionCard';
import { PackagesCard } from '@/components/settings/PackagesCard';
import { NewPackageModal, type NewPackageInput } from '@/components/settings/NewPackageModal';
import { GiftsCard } from '@/components/settings/GiftsCard';
import { CatalogListCard } from '@/components/settings/CatalogListCard';
import { InvoiceHistoryModal } from '@/components/settings/InvoiceHistoryModal';
import { WorkingHoursCard } from '@/components/settings/WorkingHoursCard';
import { NotificationPreferencesCard } from '@/components/settings/NotificationPreferencesCard';
import { SettingsTile } from '@/components/settings/SettingsTile';
import { SettingsSectionModal } from '@/components/settings/SettingsSectionModal';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useCatalogs } from '@/context/CatalogsContext';
import { colors, spacing, typography } from '@/theme';
import {
  subscriptionInfo,
  packageTemplates as initialPackages,
  giftTemplates as initialGifts,
  invoices,
  workingHours as initialWorkingHours,
  notificationPreferences as initialNotificationPreferences,
} from '@/mock/settings';
import type { PackageTemplate, GiftTemplate } from '@/types/settings';
import type { IconName } from '@/types/dashboard';

type SectionId =
  | 'studio'
  | 'tax'
  | 'hours'
  | 'subscription'
  | 'packages'
  | 'gifts'
  | 'stages'
  | 'sources'
  | 'interests'
  | 'responsibles'
  | 'categories'
  | 'notifications';

export default function SettingsScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const [packages, setPackages] = useState<PackageTemplate[]>(initialPackages);
  const [gifts, setGifts] = useState<GiftTemplate[]>(initialGifts);
  const [workingHours, setWorkingHours] = useState(initialWorkingHours);
  const [notificationPreferences, setNotificationPreferences] = useState(initialNotificationPreferences);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [newPackageModalVisible, setNewPackageModalVisible] = useState(false);
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const {
    leadSources,
    interests,
    responsibles,
    stages,
    classCategories,
    addLeadSource,
    removeLeadSource,
    addInterest,
    removeInterest,
    addResponsible,
    removeResponsible,
    addStage,
    removeStage,
    addClassCategory,
    removeClassCategory,
  } = useCatalogs();
  const { message, visible, show } = useToast();

  const handleToggleDay = (dayId: string, isOpen: boolean) => {
    setWorkingHours((current) => current.map((day) => (day.id === dayId ? { ...day, isOpen } : day)));
  };

  const handleChangeStart = (dayId: string, value: string) => {
    setWorkingHours((current) => current.map((day) => (day.id === dayId ? { ...day, start: value } : day)));
  };

  const handleChangeEnd = (dayId: string, value: string) => {
    setWorkingHours((current) => current.map((day) => (day.id === dayId ? { ...day, end: value } : day)));
  };

  const handleToggleNotification = (id: string, value: boolean) => {
    setNotificationPreferences((current) => current.map((pref) => (pref.id === id ? { ...pref, enabled: value } : pref)));
  };

  const handleDeletePackage = (pkg: PackageTemplate) => {
    setPackages((current) => current.filter((item) => item.id !== pkg.id));
    show(`${pkg.name} silindi.`);
  };

  const handleCreatePackage = (input: NewPackageInput) => {
    const newPackage: PackageTemplate = { id: `pkg-${Date.now()}`, ...input };
    setPackages((current) => [...current, newPackage]);
    show(`${newPackage.name} oluşturuldu.`);
  };

  const handleDeleteGift = (gift: GiftTemplate) => {
    setGifts((current) => current.filter((item) => item.id !== gift.id));
    show(`${gift.name} silindi.`);
  };

  const openDayCount = workingHours.filter((day) => day.isOpen).length;
  const enabledNotifications = notificationPreferences.filter((pref) => pref.enabled).length;

  const groups: { title: string; tiles: { id: SectionId; title: string; summary: string; icon: IconName }[] }[] = [
    {
      title: 'Stüdyo',
      tiles: [
        { id: 'studio', title: 'Stüdyo Bilgileri', summary: 'Ad, logo, adres ve iletişim', icon: 'business-outline' },
        { id: 'tax', title: 'Vergi ve Fatura', summary: 'Vergi dairesi, VKN ve fatura adresi', icon: 'document-text-outline' },
        { id: 'hours', title: 'Çalışma Saatleri', summary: `${openDayCount} gün açık`, icon: 'time-outline' },
        { id: 'subscription', title: 'Abonelik', summary: `${subscriptionInfo.planName} · ${subscriptionInfo.price}`, icon: 'sparkles-outline' },
      ],
    },
    {
      title: 'Satış ve Katalog',
      tiles: [
        { id: 'packages', title: 'Paketler', summary: `${packages.length} paket tanımlı`, icon: 'pricetag-outline' },
        { id: 'gifts', title: 'Hediyeler', summary: `${gifts.length} hediye tanımlı`, icon: 'gift-outline' },
        { id: 'stages', title: 'Müşteri Adayı Aşamaları', summary: `${stages.length} aşama`, icon: 'git-branch-outline' },
        { id: 'sources', title: 'Müşteri Adayı Kaynakları', summary: `${leadSources.length} kaynak`, icon: 'funnel-outline' },
        { id: 'interests', title: 'İlgi Alanları', summary: `${interests.length} ilgi alanı`, icon: 'heart-outline' },
        { id: 'responsibles', title: 'Sorumlular', summary: `${responsibles.length} kişi`, icon: 'people-outline' },
        { id: 'categories', title: 'Ders Kategorileri', summary: `${classCategories.length} kategori`, icon: 'albums-outline' },
      ],
    },
    {
      title: 'Sistem',
      tiles: [
        {
          id: 'notifications',
          title: 'Bildirim Ayarları',
          summary: `${enabledNotifications}/${notificationPreferences.length} bildirim açık`,
          icon: 'notifications-outline',
        },
      ],
    },
  ];

  const tileBasis = isMobile ? '100%' : isTablet ? '48%' : '23.5%';

  return (
    <AppShell activeId="settings">
      <View style={styles.header}>
        <Text style={styles.title}>Ayarlar</Text>
        <Text style={styles.subtitle}>Düzenlemek istediğin bölüme tıkla.</Text>
      </View>

      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.grid}>
            {group.tiles.map((tile) => (
              <View key={tile.id} style={[styles.gridItem, { flexBasis: tileBasis }]}>
                <SettingsTile
                  title={tile.title}
                  summary={tile.summary}
                  icon={tile.icon}
                  onPress={() => setOpenSection(tile.id)}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      <SettingsSectionModal visible={openSection === 'studio'} onClose={() => setOpenSection(null)}>
        <StudioProfileCard onSave={() => show('Stüdyo bilgileri kaydedildi.')} />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'tax'} onClose={() => setOpenSection(null)}>
        <TaxBillingCard
          onSave={() => show('Fatura bilgileri kaydedildi.')}
          onUploadDocument={() => show('Vergi levhası yükleme işlemi yakında açılacak.')}
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'hours'} onClose={() => setOpenSection(null)}>
        <WorkingHoursCard
          days={workingHours}
          onToggleDay={handleToggleDay}
          onChangeStart={handleChangeStart}
          onChangeEnd={handleChangeEnd}
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'subscription'} onClose={() => setOpenSection(null)}>
        <SubscriptionCard
          subscription={subscriptionInfo}
          onUpgrade={() => show('Plan yükseltme işlemi yakında açılacak.')}
          onViewInvoices={() => setInvoiceModalVisible(true)}
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'packages'} onClose={() => setOpenSection(null)}>
        <PackagesCard
          packages={packages}
          onCreatePackage={() => setNewPackageModalVisible(true)}
          onEditPackage={(pkg) => show(`${pkg.name} düzenleme işlemi yakında açılacak.`)}
          onDeletePackage={handleDeletePackage}
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'gifts'} onClose={() => setOpenSection(null)}>
        <GiftsCard
          gifts={gifts}
          onCreateGift={() => show('Yeni hediye ekleme işlemi yakında açılacak.')}
          onDeleteGift={handleDeleteGift}
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'stages'} onClose={() => setOpenSection(null)}>
        <CatalogListCard
          title="Müşteri Adayı Aşamaları"
          icon="git-branch-outline"
          subtitle="Müşteri adayları kanban ve listesinde kullanılan aşamaları yönet."
          items={stages.map((stage) => ({ id: stage.id, label: stage.title }))}
          onAdd={(label) => {
            addStage(label);
            show(`${label} aşaması eklendi.`);
          }}
          onRemove={(id) => {
            const stage = stages.find((item) => item.id === id);
            removeStage(id);
            if (stage) show(`${stage.title} aşaması silindi.`);
          }}
          addPlaceholder="Yeni aşama adı"
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'sources'} onClose={() => setOpenSection(null)}>
        <CatalogListCard
          title="Müşteri Adayı Kaynakları"
          icon="funnel-outline"
          subtitle="Yeni müşteri adayı eklerken seçilebilecek kaynakları yönet."
          items={leadSources.map((source) => ({ id: source.id, label: source.label }))}
          onAdd={(label) => {
            addLeadSource(label);
            show(`${label} kaynağı eklendi.`);
          }}
          onRemove={(id) => {
            const source = leadSources.find((item) => item.id === id);
            removeLeadSource(id);
            if (source) show(`${source.label} kaynağı silindi.`);
          }}
          addPlaceholder="Yeni kaynak adı"
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'interests'} onClose={() => setOpenSection(null)}>
        <CatalogListCard
          title="İlgi Alanları"
          icon="heart-outline"
          subtitle="Müşteri adaylarının ilgilendiği ders/hizmet türlerini yönet."
          items={interests.map((interest) => ({ id: interest, label: interest }))}
          onAdd={(label) => {
            addInterest(label);
            show(`${label} ilgi alanı eklendi.`);
          }}
          onRemove={(id) => {
            removeInterest(id);
            show(`${id} ilgi alanı silindi.`);
          }}
          addPlaceholder="Yeni ilgi alanı"
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'responsibles'} onClose={() => setOpenSection(null)}>
        <CatalogListCard
          title="Sorumlular"
          icon="people-outline"
          subtitle="Müşteri adaylarına atanabilecek ekip üyelerini yönet."
          items={responsibles.map((responsible) => ({ id: responsible, label: responsible }))}
          onAdd={(label) => {
            addResponsible(label);
            show(`${label} sorumlu listesine eklendi.`);
          }}
          onRemove={(id) => {
            removeResponsible(id);
            show(`${id} sorumlu listesinden çıkarıldı.`);
          }}
          addPlaceholder="Yeni sorumlu adı"
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'categories'} onClose={() => setOpenSection(null)}>
        <CatalogListCard
          title="Ders Kategorileri"
          icon="albums-outline"
          subtitle="Yeni ders oluştururken seçilebilecek kategorileri yönet."
          items={classCategories.map((category) => ({ id: category, label: category }))}
          onAdd={(label) => {
            addClassCategory(label);
            show(`${label} kategorisi eklendi.`);
          }}
          onRemove={(id) => {
            removeClassCategory(id);
            show(`${id} kategorisi silindi.`);
          }}
          addPlaceholder="Yeni kategori adı"
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'notifications'} onClose={() => setOpenSection(null)}>
        <NotificationPreferencesCard preferences={notificationPreferences} onToggle={handleToggleNotification} />
      </SettingsSectionModal>

      <NewPackageModal
        visible={newPackageModalVisible}
        onClose={() => setNewPackageModalVisible(false)}
        onCreate={handleCreatePackage}
      />

      <InvoiceHistoryModal
        visible={invoiceModalVisible}
        invoices={invoices}
        onClose={() => setInvoiceModalVisible(false)}
        onDownload={(invoice) => show(`${invoice.fileName} indiriliyor...`)}
      />

      <Toast message={message} visible={visible} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    ...typography.pageTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.pageSubtitle,
    color: colors.textSecondary,
  },
  group: {
    gap: spacing.md,
  },
  groupTitle: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  gridItem: {
    flexGrow: 0,
    minWidth: 220,
  },
});
