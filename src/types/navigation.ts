import type { IconName } from './dashboard';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: IconName;
}

