import { Platform } from 'react-native';

// Very light elevation used across cards — kept subtle per Fitbase design spec.
export const cardShadow = Platform.select({
  web: {
    boxShadow: '0 1px 3px rgba(32, 35, 33, 0.06)',
  },
  default: {
    shadowColor: '#202321',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
});
