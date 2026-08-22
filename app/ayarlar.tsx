import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppShell } from '@/components/layout/AppShell';
import { StudioProfileCard } from '@/components/settings/StudioProfileCard';
import { TaxBillingCard } from '@/components/settings/TaxBillingCard';
import { SubscriptionCard } from '@/components/settings/SubscriptionCard';
import { PackagesCard } from '@/components/settings/PackagesCard';
import { PackageFormModal, type PackageDraft } from '@/components/settings/PackageFormModal';
import { GiftsCard } from '@/components/settings/GiftsCard';
import { GiftFormModal, type GiftDraft } from '@/components/settings/GiftFormModal';
import { CatalogListCard } from '@/components/settings/CatalogListCard';
import {
  CatalogUsageConflictDialog,
  type CatalogReplacement,
} from '@/components/settings/CatalogUsageConflictDialog';
import { InvoiceHistoryModal } from '@/components/settings/InvoiceHistoryModal';
import { WorkingHoursCard } from '@/components/settings/WorkingHoursCard';
import { ClosuresCard } from '@/components/settings/ClosuresCard';
import { LocalizationCard } from '@/components/settings/LocalizationCard';
import { ReceivablesPolicyCard } from '@/components/settings/ReceivablesPolicyCard';
import { NotificationPreferencesCard } from '@/components/settings/NotificationPreferencesCard';
import { WhatsAppTemplateCard } from '@/components/settings/WhatsAppTemplateCard';
import { SettingsTile } from '@/components/settings/SettingsTile';
import { SettingsSectionModal } from '@/components/settings/SettingsSectionModal';
import { useToast } from '@/context/ToastContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useCatalogs } from '@/context/CatalogsContext';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography } from '@/theme';
import { subscriptionInfo, invoices } from '@/mock/settings';
import * as catalogsApi from '@/api/catalogs';
import * as settingsApi from '@/api/settings';
import * as messagingApi from '@/api/messaging';
import { ApiError, describeProblem } from '@/api/problem';
import { toSettingsSection, type SettingsSectionId } from '@/utils/settingsLinks';
import type { IconName } from '@/types/dashboard';

type SectionId = SettingsSectionId;

/** The welcome template's audience, as the tile summary says it. */
const AUDIENCE_LABELS: Record<NonNullable<messagingApi.WelcomeTemplateAudience>, string> = {
  Leads: 'Müşteri adayları',
  Customers: 'Müşteriler',
  Both: 'Herkes',
};

/** The settings screen's two reads, which always arrive and fail together. */
interface LoadedSettings {
  settings: settingsApi.OrganizationSettings;
  summary: settingsApi.OrganizationSettingsSummary;
}

/**
 * Reads both, reporting failure as a value.
 *
 * One request rather than two round trips: the summary is the tile counters and the settings are
 * what the sections render, and a screen showing counts it cannot open is worse than one that says
 * it could not load.
 */
async function fetchSettings(): Promise<LoadedSettings | null> {
  try {
    const [settings, summary] = await Promise.all([
      settingsApi.getSettings(),
      settingsApi.getSettingsSummary(),
    ]);

    return { settings, summary };
  } catch {
    return null;
  }
}

/**
 * What a catalog list needs to talk to the API.
 *
 * Keyed by the section so the generic list card stays generic — it renders `{id, label}` and calls
 * back, and everything kind-specific is here rather than branched inside the card.
 */
interface CatalogBinding {
  kind: catalogsApi.CatalogKindSegment;
  create: (label: string) => Promise<unknown>;
  noun: string;
}

/**
 * Everything the studio configures about itself.
 *
 * <b>The Sorumlular tile is gone.</b> It listed free-text names duplicated from the Team screen;
 * assignments key on `staff_member.id` (backend ADR-0016) and the vocabulary register bans the
 * concept outright, so the roster is where those people are managed. Its counter is replaced by
 * the active staff count in the summary.
 */
export default function SettingsScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const { stages, leadSources, interests, classCategories, packages, gifts, status, refresh } =
    useCatalogs();
  const { show } = useToast();
  const { permissions, timeZoneId } = useAuth();

  // Manager-only, and hiding the tile is presentation — the endpoint refuses everyone else anyway.
  // What it prevents is a Sales user opening a section whose every request 403s.
  const canManageTemplates = permissions['messaging.templates.manage'] !== undefined;

  const [settings, setSettings] = useState<settingsApi.OrganizationSettings | null>(null);
  const [summary, setSummary] = useState<settingsApi.OrganizationSettingsSummary | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  /**
   * The WhatsApp welcome message, loaded on its own.
   *
   * <b>Separate from the settings read, and not part of the screen's loading gate.</b> It sits
   * behind `messaging.templates.manage`, which only a manager holds — so for a Sales user the call
   * is a 403, and folding it into `fetchSettings` would make the whole settings screen render its
   * "could not load" state for a permission they were never expected to have. Null covers both
   * "not loaded yet" and "not yours"; the tile is hidden either way.
   */
  const [welcome, setWelcome] = useState<messagingApi.WelcomeTemplateView | null>(null);

  // `?bolum=packages` opens that section straight away, so an empty state elsewhere in the app can
  // send somebody to the thing they are missing rather than to the settings index to hunt for it.
  const { bolum } = useLocalSearchParams<{ bolum?: string }>();

  const [openSection, setOpenSection] = useState<SectionId | null>(() => toSettingsSection(bolum));
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [packageForm, setPackageForm] = useState<{
    open: boolean;
    editing: catalogsApi.PackageTemplateEntry | null;
  }>({ open: false, editing: null });
  const [giftForm, setGiftForm] = useState<{
    open: boolean;
    editing: catalogsApi.GiftTemplateEntry | null;
  }>({ open: false, editing: null });
  const [conflict, setConflict] = useState<{
    kind: catalogsApi.CatalogKindSegment;
    entryId: string;
    entryLabel: string;
    references: catalogsApi.CatalogReference[];
    replacements: CatalogReplacement[];
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const applySettings = useCallback((loaded: LoadedSettings | null) => {
    if (loaded === null) {
      setSettingsStatus('error');
      return;
    }

    setSettings(loaded.settings);
    setSummary(loaded.summary);
    setSettingsStatus('ready');
  }, []);

  const loadSettings = useCallback(async () => {
    applySettings(await fetchSettings());
  }, [applySettings]);


  useEffect(() => {
    let cancelled = false;

    // An inline async body rather than a call to `loadSettings`: state must not be set
    // synchronously inside an effect, and the `await` here is what makes it not.
    void (async () => {
      const loaded = await fetchSettings();
      if (!cancelled) applySettings(loaded);
    })();

    return () => {
      cancelled = true;
    };
  }, [applySettings]);

  useEffect(() => {
    if (!canManageTemplates) return;

    let cancelled = false;

    void (async () => {
      try {
        const loaded = await messagingApi.getWelcomeTemplate();
        if (!cancelled) setWelcome(loaded);
      } catch {
        // Left null, which hides the tile. A settings screen that reported a failure on a section
        // nobody had opened would be an error message about something the reader was not doing.
        if (!cancelled) setWelcome(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canManageTemplates]);

  /**
   * Runs a mutation, refreshes, and reports.
   *
   * Every write on this screen goes through here so that none of them can forget the refresh — a
   * create that does not reload leaves the studio looking at a list missing the thing they just
   * made, and they add it again.
   */
  const run = async (operation: () => Promise<void>, success: string) => {
    setBusy(true);

    try {
      await operation();
      await Promise.all([refresh(), loadSettings()]);
      show(success);
    } catch (thrown) {
      show(
        thrown instanceof ApiError
          ? describeProblem(thrown.problem)
          : 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
      );
    } finally {
      setBusy(false);
    }
  };

  /**
   * Deletes a catalog entry, or opens the conflict dialog when something still uses it.
   *
   * The usage probe runs first so the studio sees the choice instead of an error. The server
   * refuses either way — this is the courteous version of the same answer, not the check.
   */
  const deleteEntry = async (
    kind: catalogsApi.CatalogKindSegment,
    entryId: string,
    entryLabel: string,
    siblings: { id: string; label: string }[],
    noun: string,
  ) => {
    setBusy(true);

    try {
      const usage = await catalogsApi.getCatalogEntryUsage(kind, entryId);

      if (!usage.canDelete) {
        setConflict({
          kind,
          entryId,
          entryLabel,
          references: usage.references.filter((reference) => reference.blocksDeletion),
          replacements: siblings.filter((sibling) => sibling.id !== entryId),
        });
        return;
      }

      await catalogsApi.deleteCatalogEntry(kind, entryId);
      await Promise.all([refresh(), loadSettings()]);
      show(`${entryLabel} ${noun} silindi.`);
    } catch (thrown) {
      show(
        thrown instanceof ApiError
          ? describeProblem(thrown.problem)
          : 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
      );
    } finally {
      setBusy(false);
    }
  };

  const tileBasis = isMobile ? '100%' : isTablet ? '48%' : '23.5%';

  if (status === 'loading' || settingsStatus === 'loading') {
    return (
      <AppShell activeId="settings">
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </AppShell>
    );
  }

  if (status === 'error' || settingsStatus === 'error' || settings === null) {
    // Distinguished from "nothing configured yet" on purpose. An empty settings screen and one
    // that failed to load look identical, and only one of them is worth telling somebody about.
    return (
      <AppShell activeId="settings">
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Ayarlar yüklenemedi</Text>
          <Text style={styles.errorBody}>Bağlantını kontrol edip sayfayı yenile.</Text>
        </View>
      </AppShell>
    );
  }

  const count = (value: number | undefined) => value ?? 0;

  const groups: {
    title: string;
    tiles: { id: SectionId; title: string; summary: string; icon: IconName }[];
  }[] = [
    {
      title: 'Stüdyo',
      tiles: [
        {
          id: 'studio',
          title: 'Stüdyo Bilgileri',
          summary: 'Ad, logo, adres ve iletişim',
          icon: 'business-outline',
        },
        {
          id: 'tax',
          title: 'Vergi ve Fatura',
          summary: 'Vergi dairesi, VKN ve fatura adresi',
          icon: 'document-text-outline',
        },
        {
          id: 'hours',
          title: 'Çalışma Saatleri',
          summary: `${count(summary?.openDays)} gün açık`,
          icon: 'time-outline',
        },
        {
          id: 'closures',
          title: 'Kapalı Günler',
          summary: `${count(summary?.upcomingClosures)} yaklaşan kapanış`,
          icon: 'calendar-outline',
        },
        {
          id: 'localization',
          title: 'Bölge ve Dil',
          summary: `${settings.localization.timeZoneId} · ${settings.localization.currency}`,
          icon: 'globe-outline',
        },
        {
          // The setting decides what "gecikti" means on the receivables list and the dashboard's
          // overdue tile. It has been settable through the API since Phase 2.5 and reachable from
          // nowhere, so the summary shows the value a studio has been on without choosing.
          id: 'receivables',
          title: 'Gecikme Süresi',
          summary:
            settings.receivables.overdueGraceDays === 0
              ? 'Vade günü sonrası gecikmiş'
              : `${settings.receivables.overdueGraceDays} gün sonra gecikmiş`,
          icon: 'hourglass-outline',
        },
        {
          id: 'subscription',
          title: 'Abonelik',
          summary: `${subscriptionInfo.planName} · ${subscriptionInfo.price}`,
          icon: 'sparkles-outline',
        },
      ],
    },
    {
      title: 'Satış ve Katalog',
      tiles: [
        {
          id: 'packages',
          title: 'Paketler',
          summary: `${count(summary?.packageTemplates)} paket tanımlı`,
          icon: 'pricetag-outline',
        },
        {
          id: 'gifts',
          title: 'Hediyeler',
          summary: `${count(summary?.giftTemplates)} hediye tanımlı`,
          icon: 'gift-outline',
        },
        {
          id: 'stages',
          title: 'Müşteri Adayı Aşamaları',
          summary: `${count(summary?.leadStages)} aşama`,
          icon: 'git-branch-outline',
        },
        {
          id: 'sources',
          title: 'Müşteri Adayı Kaynakları',
          summary: `${count(summary?.leadSources)} kaynak`,
          icon: 'funnel-outline',
        },
        {
          id: 'interests',
          title: 'İlgi Alanları',
          summary: `${count(summary?.interests)} ilgi alanı`,
          icon: 'heart-outline',
        },
        {
          id: 'categories',
          title: 'Ders Kategorileri',
          summary: `${count(summary?.classCategories)} kategori`,
          icon: 'albums-outline',
        },
      ],
    },
    {
      title: 'Sistem',
      tiles: [
        {
          id: 'notifications',
          title: 'Bildirim Ayarları',
          summary: `${count(summary?.enabledNotifications)}/${count(summary?.availableNotifications)} bildirim açık`,
          icon: 'notifications-outline',
        },

        // Present only for a manager, and only once the template has loaded. The summary is the
        // fact the studio is deciding about — whether anything is being sent — rather than a
        // count, because there is only ever one of these.
        ...(welcome !== null
          ? [
              {
                id: 'whatsapp' as const,
                title: 'WhatsApp Karşılama',
                summary: welcome.autoSendEnabled
                  ? `Açık · ${AUDIENCE_LABELS[welcome.audience ?? 'Both']}`
                  : welcome.configured
                    ? 'Kapalı'
                    : 'Tanımlı değil',
                icon: 'chatbubble-ellipses-outline' as IconName,
              },
            ]
          : []),
      ],
    },
  ];

  const stageItems = stages.map((stage) => ({
    id: stage.id,
    label: stage.title,
  }));
  const sourceItems = leadSources.map((source) => ({
    id: source.id,
    label: source.label,
  }));
  const interestItems = interests.map((interest) => ({
    id: interest.id,
    label: interest.label,
  }));
  const categoryItems = classCategories.map((category) => ({
    id: category.id,
    label: category.label,
  }));

  const CATALOGS: Record<'stages' | 'sources' | 'interests' | 'categories', CatalogBinding> = {
    stages: {
      kind: 'lead-stages',
      noun: 'aşaması',
      create: (label) =>
        catalogsApi.createLeadStage({
          title: label,
          statusLabel: label,
          tone: 'mint',
        }),
    },
    sources: {
      kind: 'lead-sources',
      noun: 'kaynağı',
      create: (label) => catalogsApi.createLeadSource({ label, icon: 'pricetag-outline' }),
    },
    interests: {
      kind: 'interests',
      noun: 'ilgi alanı',
      create: (label) => catalogsApi.createInterest(label),
    },
    categories: {
      kind: 'class-categories',
      noun: 'kategorisi',
      create: (label) => catalogsApi.createClassCategory(label),
    },
  };

  const renderCatalog = (
    section: 'stages' | 'sources' | 'interests' | 'categories',
    title: string,
    icon: IconName,
    subtitle: string,
    items: { id: string; label: string }[],
    addPlaceholder: string,
  ) => {
    const binding = CATALOGS[section];

    return (
      <SettingsSectionModal visible={openSection === section} onClose={() => setOpenSection(null)}>
        <CatalogListCard
          title={title}
          icon={icon}
          subtitle={subtitle}
          items={items}
          onAdd={(label) =>
            void run(async () => {
              await binding.create(label);
            }, `${label} ${binding.noun} eklendi.`)
          }
          onRemove={(id) => {
            const entry = items.find((item) => item.id === id);
            void deleteEntry(binding.kind, id, entry?.label ?? '', items, binding.noun);
          }}
          addPlaceholder={addPlaceholder}
        />
      </SettingsSectionModal>
    );
  };

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
        <StudioProfileCard
          profile={settings.profile}
          busy={busy}
          onUploadLogo={() => show('Logo yükleme yakında açılacak.')}
          onSave={(draft) =>
            run(async () => {
              await settingsApi.updateProfile(draft);
            }, 'Stüdyo bilgileri kaydedildi.')
          }
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'tax'} onClose={() => setOpenSection(null)}>
        <TaxBillingCard
          tax={settings.tax}
          busy={busy}
          onUploadDocument={() => show('Vergi levhası yükleme yakında açılacak.')}
          onSave={(draft) =>
            run(async () => {
              await settingsApi.updateTaxProfile(draft);
            }, 'Fatura bilgileri kaydedildi.')
          }
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'hours'} onClose={() => setOpenSection(null)}>
        {openSection === 'hours' ? (
          <WorkingHoursCard
            intervals={settings.businessHours}
            busy={busy}
            onSave={(intervals) =>
              run(async () => {
                await settingsApi.replaceBusinessHours(intervals);
              }, 'Çalışma saatleri kaydedildi.')
            }
          />
        ) : null}
      </SettingsSectionModal>

      <SettingsSectionModal
        visible={openSection === 'closures'}
        onClose={() => setOpenSection(null)}
      >
        {openSection === 'closures' ? (
          <ClosuresCard
            closures={settings.closures}
            timeZoneId={settings.localization.timeZoneId}
            busy={busy}
            onAdd={(draft) =>
              run(async () => {
                await settingsApi.addClosure(draft);
              }, `${draft.reason} eklendi.`)
            }
            onRemove={(closure) =>
              void run(async () => {
                await settingsApi.removeClosure(closure.id);
              }, `${closure.reason} kaldırıldı.`)
            }
          />
        ) : null}
      </SettingsSectionModal>

      <SettingsSectionModal
        visible={openSection === 'localization'}
        onClose={() => setOpenSection(null)}
      >
        {openSection === 'localization' ? (
          <LocalizationCard
            localization={settings.localization}
            busy={busy}
            onSave={(localization) =>
              run(async () => {
                await settingsApi.updateLocalization(localization);
              }, 'Bölge ayarları kaydedildi.')
            }
          />
        ) : null}
      </SettingsSectionModal>

      <SettingsSectionModal
        visible={openSection === 'receivables'}
        onClose={() => setOpenSection(null)}
      >
        {openSection === 'receivables' ? (
          <ReceivablesPolicyCard
            receivables={settings.receivables}
            busy={busy}
            onSave={(overdueGraceDays) =>
              run(async () => {
                await settingsApi.updateReceivablesPolicy(overdueGraceDays);
              }, 'Gecikme süresi kaydedildi.')
            }
          />
        ) : null}
      </SettingsSectionModal>

      <SettingsSectionModal
        visible={openSection === 'subscription'}
        onClose={() => setOpenSection(null)}
      >
        <SubscriptionCard
          subscription={subscriptionInfo}
          onUpgrade={() => show('Plan yükseltme işlemi yakında açılacak.')}
          onViewInvoices={() => setInvoiceModalVisible(true)}
        />
      </SettingsSectionModal>

      <SettingsSectionModal
        visible={openSection === 'packages'}
        onClose={() => setOpenSection(null)}
      >
        <PackagesCard
          packages={packages}
          onCreatePackage={() => setPackageForm({ open: true, editing: null })}
          onEditPackage={(pkg) => setPackageForm({ open: true, editing: pkg })}
          onDeletePackage={(pkg) =>
            void deleteEntry(
              'package-templates',
              pkg.id,
              pkg.name,
              packages.map((entry) => ({ id: entry.id, label: entry.name })),
              'paketi',
            )
          }
        />
      </SettingsSectionModal>

      <SettingsSectionModal visible={openSection === 'gifts'} onClose={() => setOpenSection(null)}>
        <GiftsCard
          gifts={gifts}
          onCreateGift={() => setGiftForm({ open: true, editing: null })}
          onDeleteGift={(gift) =>
            void deleteEntry(
              'gift-templates',
              gift.id,
              gift.name,
              gifts.map((entry) => ({ id: entry.id, label: entry.name })),
              'hediyesi',
            )
          }
        />
      </SettingsSectionModal>

      {renderCatalog(
        'stages',
        'Müşteri Adayı Aşamaları',
        'git-branch-outline',
        'Müşteri adayları kanban ve listesinde kullanılan aşamaları yönet.',
        stageItems,
        'Yeni aşama adı',
      )}

      {renderCatalog(
        'sources',
        'Müşteri Adayı Kaynakları',
        'funnel-outline',
        'Yeni müşteri adayı eklerken seçilebilecek kaynakları yönet.',
        sourceItems,
        'Yeni kaynak adı',
      )}

      {renderCatalog(
        'interests',
        'İlgi Alanları',
        'heart-outline',
        'Müşteri adaylarının ilgilendiği ders/hizmet türlerini yönet.',
        interestItems,
        'Yeni ilgi alanı',
      )}

      {renderCatalog(
        'categories',
        'Ders Kategorileri',
        'albums-outline',
        'Yeni ders oluştururken seçilebilecek kategorileri yönet.',
        categoryItems,
        'Yeni kategori adı',
      )}

      <SettingsSectionModal
        visible={openSection === 'notifications'}
        onClose={() => setOpenSection(null)}
      >
        <NotificationPreferencesCard
          preferences={settings.notifications}
          busy={busy}
          onToggle={(topic, channel, isEnabled) =>
            void run(async () => {
              await settingsApi.setNotificationPreference({
                topic,
                channel,
                isEnabled,
              });
            }, 'Bildirim tercihi güncellendi.')
          }
        />
      </SettingsSectionModal>

      {welcome !== null && (
        <SettingsSectionModal
          visible={openSection === 'whatsapp'}
          onClose={() => setOpenSection(null)}
        >
          <WhatsAppTemplateCard
            template={welcome}
            timeZoneId={timeZoneId}
            busy={busy}
            onSave={(draft) =>
              run(async () => {
                // The response is the saved state plus the delivery list, so the card reseeds from
                // the server rather than from what was typed — which is what makes "settings
                // persist after refreshing the page" true of the screen and not only of the table.
                setWelcome(await messagingApi.saveWelcomeTemplate(draft));
              }, 'WhatsApp karşılama mesajı kaydedildi.')
            }
          />
        </SettingsSectionModal>
      )}

      {/*
        Mounted only while open and keyed by the entry. That is what lets the modal seed its fields
        from props at mount instead of watching them in an effect — React's own answer to resetting
        state on a prop change, and one render cheaper.
      */}
      {packageForm.open ? (
        <PackageFormModal
          key={packageForm.editing?.id ?? 'new'}
          visible
          editing={packageForm.editing}
          busy={busy}
          onClose={() => setPackageForm({ open: false, editing: null })}
          onSubmit={async (draft: PackageDraft) => {
            const editing = packageForm.editing;

            await run(
              async () => {
                if (editing) {
                  await catalogsApi.updatePackageTemplate(editing.id, draft);
                } else {
                  await catalogsApi.createPackageTemplate(draft);
                }
              },
              editing ? `${draft.name} güncellendi.` : `${draft.name} oluşturuldu.`,
            );

            setPackageForm({ open: false, editing: null });
          }}
        />
      ) : null}

      {giftForm.open ? (
        <GiftFormModal
          key={giftForm.editing?.id ?? 'new'}
          visible
          editing={giftForm.editing}
          busy={busy}
          onClose={() => setGiftForm({ open: false, editing: null })}
          onSubmit={async (draft: GiftDraft) => {
            const editing = giftForm.editing;

            await run(
              async () => {
                if (editing) {
                  await catalogsApi.updateGiftTemplate(editing.id, draft);
                } else {
                  await catalogsApi.createGiftTemplate(draft);
                }
              },
              editing ? `${draft.name} güncellendi.` : `${draft.name} oluşturuldu.`,
            );

            setGiftForm({ open: false, editing: null });
          }}
        />
      ) : null}

      <CatalogUsageConflictDialog
        visible={conflict !== null}
        entryLabel={conflict?.entryLabel ?? ''}
        references={conflict?.references ?? []}
        replacements={conflict?.replacements ?? []}
        busy={busy}
        onClose={() => setConflict(null)}
        onDeactivate={() => {
          const target = conflict;
          if (!target) return;

          setConflict(null);
          void run(async () => {
            await catalogsApi.setCatalogEntryStatus(target.kind, target.entryId, 'Inactive');
          }, `${target.entryLabel} pasife alındı.`);
        }}
        onReassign={(replacementId) => {
          const target = conflict;
          if (!target) return;

          setConflict(null);
          void run(async () => {
            await catalogsApi.deleteCatalogEntry(target.kind, target.entryId, replacementId);
          }, `${target.entryLabel} taşındı ve silindi.`);
        }}
      />

      <InvoiceHistoryModal
        visible={invoiceModalVisible}
        invoices={invoices}
        onClose={() => setInvoiceModalVisible(false)}
        onDownload={(invoice) => show(`${invoice.fileName} indiriliyor...`)}
      />

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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  errorTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  errorBody: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
