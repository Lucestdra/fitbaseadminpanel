import { useWindowDimensions } from 'react-native';
import { breakpoints } from '@/theme';

export type LayoutSize = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveLayout {
  width: number;
  size: LayoutSize;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width } = useWindowDimensions();

  let size: LayoutSize = 'desktop';
  if (width <= breakpoints.mobileMax) {
    size = 'mobile';
  } else if (width <= breakpoints.tabletMax) {
    size = 'tablet';
  }

  return {
    width,
    size,
    isMobile: size === 'mobile',
    isTablet: size === 'tablet',
    isDesktop: size === 'desktop',
  };
}
