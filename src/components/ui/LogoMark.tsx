import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme';

interface LogoMarkProps {
  size?: number;
  color?: string;
}

export function LogoMark({ size = 32, color = colors.primary }: LogoMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        fill={color}
        d="
          M 44 4
          C 26 4 14 15 14 32
          L 14 68
          C 14 80 19 89 28 94
          C 25 85 27 76 35 69
          C 43 63 53 62 62 62
          L 62 46
          L 50 46
          L 50 34
          L 62 34
          L 62 32
          C 62 14 56 4 44 4
          Z
        "
      />
    </Svg>
  );
}
