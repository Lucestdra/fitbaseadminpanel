import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * A tile showing a count derived from a list already on the screen.
 *
 * <b>Not a metric.</b> Anything from the metric register goes through `MetricCard`, which carries a
 * definition, a polarity and a statement of when the number is incomplete — see
 * `docs/contracts/metrics.md` in the backend. This is for "42 aktif ders" beside the class table:
 * a count of rows the user can see, with nothing to define.
 */
export interface KpiItem {
  id: string;
  title: string;
  value: string;
  change?: string;
  icon: IconName;
  href?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: IconName;
  toastMessage: string;
}
