import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'tier-1' | 'tier-2' | 'tier-3' | 'tier-4' | 'tier-5'
  | 'search' | 'calendar' | 'phone' | 'plus' | 'check' | 'trash'
  | 'wave' | 'tag' | 'clock' | 'rocket'
  | 'home' | 'gear' | 'target' | 'note' | 'bell' | 'send'
  | 'inbox' | 'download' | 'warning' | 'no-signal' | 'list' | 'user-plus'
  | 'close';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 16, color = '#000', strokeWidth = 2 }: IconProps) {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'tier-1' && <Path d="M20.8 4.6c-1.5-1.5-4-1.5-5.6 0L12 7.8 8.8 4.6c-1.5-1.5-4-1.5-5.6 0-1.5 1.5-1.5 4 0 5.6L12 19l8.8-8.8c1.5-1.6 1.5-4.1 0-5.6z" {...stroke} />}
      {name === 'tier-2' && <Path d="M12 2c1 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-4 1.5 1 3 3 3 6a6 6 0 0 1-12 0c0-5 3-7 6-11z" {...stroke} />}
      {name === 'tier-3' && (
        <>
          <Circle cx="12" cy="12" r="4" {...stroke} />
          <Line x1="12" y1="2" x2="12" y2="4" {...stroke} />
          <Line x1="12" y1="20" x2="12" y2="22" {...stroke} />
          <Line x1="2" y1="12" x2="4" y2="12" {...stroke} />
          <Line x1="20" y1="12" x2="22" y2="12" {...stroke} />
          <Line x1="4.9" y1="4.9" x2="6.3" y2="6.3" {...stroke} />
          <Line x1="17.7" y1="17.7" x2="19.1" y2="19.1" {...stroke} />
          <Line x1="4.9" y1="19.1" x2="6.3" y2="17.7" {...stroke} />
          <Line x1="17.7" y1="6.3" x2="19.1" y2="4.9" {...stroke} />
        </>
      )}
      {name === 'tier-4' && <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" {...stroke} />}
      {name === 'tier-5' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Ellipse cx="12" cy="12" rx="4" ry="9" {...stroke} />
          <Line x1="3" y1="12" x2="21" y2="12" {...stroke} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx="11" cy="11" r="7" {...stroke} />
          <Line x1="21" y1="21" x2="16.65" y2="16.65" {...stroke} />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect x="3" y="4" width="18" height="18" rx="2" {...stroke} />
          <Line x1="16" y1="2" x2="16" y2="6" {...stroke} />
          <Line x1="8" y1="2" x2="8" y2="6" {...stroke} />
          <Line x1="3" y1="10" x2="21" y2="10" {...stroke} />
        </>
      )}
      {name === 'phone' && (
        <>
          <Rect x="5" y="2" width="14" height="20" rx="2" {...stroke} />
          <Line x1="12" y1="18" x2="12.01" y2="18" {...stroke} />
        </>
      )}
      {name === 'plus' && (
        <>
          <Line x1="12" y1="5" x2="12" y2="19" {...stroke} />
          <Line x1="5" y1="12" x2="19" y2="12" {...stroke} />
        </>
      )}
      {name === 'check' && <Path d="M20 6 9 17l-5-5" {...stroke} />}
      {name === 'trash' && (
        <>
          <Path d="M3 6h18" {...stroke} />
          <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...stroke} />
          <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" {...stroke} />
        </>
      )}
      {name === 'wave' && <Path d="M18 12.5V7a2 2 0 0 0-4 0M14 7V5a2 2 0 0 0-4 0v7M10 6a2 2 0 0 0-4 0v9M6 12l-1.5 1.5a3 3 0 0 0 0 4.2l3 3a5 5 0 0 0 3.5 1.5h2a6 6 0 0 0 6-6v-4a2 2 0 0 0-4 0" {...stroke} />}
      {name === 'tag' && (
        <>
          <Path d="M20.6 12.6 12.4 20.8a2 2 0 0 1-2.8 0L3 14.2a2 2 0 0 1 0-2.8L11.2 3.2A2 2 0 0 1 12.6 2.6H19a2 2 0 0 1 2 2v6.4a2 2 0 0 1-.4 1.6z" {...stroke} />
          <Circle cx="16" cy="7" r="1.2" fill={color} stroke="none" />
        </>
      )}
      {name === 'clock' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M12 7v5l3 3" {...stroke} />
        </>
      )}
      {name === 'rocket' && (
        <>
          <Path d="M12 2c3 1 6 4 6 9 0 3-1.5 5.5-3 7l-1.5-1.5M12 2c-3 1-6 4-6 9 0 3 1.5 5.5 3 7l1.5-1.5M12 2v14" {...stroke} />
          <Path d="M8 17l-2 4M16 17l2 4" {...stroke} />
        </>
      )}
      {name === 'home' && (
        <>
          <Path d="M3 11.5 12 4l9 7.5" {...stroke} />
          <Path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" {...stroke} />
        </>
      )}
      {name === 'gear' && (
        <>
          <Circle cx="12" cy="12" r="3" {...stroke} />
          <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" {...stroke} />
        </>
      )}
      {name === 'target' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Circle cx="12" cy="12" r="5" {...stroke} />
          <Circle cx="12" cy="12" r="1.3" fill={color} stroke="none" />
        </>
      )}
      {name === 'note' && (
        <>
          <Path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" {...stroke} />
          <Path d="M14 2v6h6" {...stroke} />
          <Line x1="9" y1="13" x2="15" y2="13" {...stroke} />
          <Line x1="9" y1="17" x2="13" y2="17" {...stroke} />
        </>
      )}
      {name === 'bell' && (
        <>
          <Path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" {...stroke} />
          <Path d="M10 21a2 2 0 0 0 4 0" {...stroke} />
        </>
      )}
      {name === 'send' && <Path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" {...stroke} />}
      {name === 'inbox' && (
        <>
          <Path d="M3 12h4l2 3h6l2-3h4" {...stroke} />
          <Path d="M5.5 5h13l2.5 7v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7z" {...stroke} />
        </>
      )}
      {name === 'download' && (
        <>
          <Path d="M12 3v12m0 0-4-4m4 4 4-4" {...stroke} />
          <Path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" {...stroke} />
        </>
      )}
      {name === 'warning' && (
        <>
          <Path d="M12 3 2 20h20L12 3z" {...stroke} />
          <Line x1="12" y1="10" x2="12" y2="14" {...stroke} />
          <Line x1="12" y1="17" x2="12.01" y2="17" {...stroke} />
        </>
      )}
      {name === 'no-signal' && (
        <>
          <Line x1="3" y1="3" x2="21" y2="21" {...stroke} />
          <Path d="M8.5 16.5a5 5 0 0 1 5-1.2M5 13a9 9 0 0 1 3-2M19 13a9 9 0 0 0-2.5-3.5M12 20.01l.01-.01" {...stroke} />
        </>
      )}
      {name === 'list' && (
        <>
          <Line x1="8" y1="6" x2="21" y2="6" {...stroke} />
          <Line x1="8" y1="12" x2="21" y2="12" {...stroke} />
          <Line x1="8" y1="18" x2="21" y2="18" {...stroke} />
          <Line x1="3" y1="6" x2="3.01" y2="6" {...stroke} />
          <Line x1="3" y1="12" x2="3.01" y2="12" {...stroke} />
          <Line x1="3" y1="18" x2="3.01" y2="18" {...stroke} />
        </>
      )}
      {name === 'user-plus' && (
        <>
          <Circle cx="9" cy="8" r="4" {...stroke} />
          <Path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" {...stroke} />
          <Line x1="19" y1="8" x2="19" y2="14" {...stroke} />
          <Line x1="16" y1="11" x2="22" y2="11" {...stroke} />
        </>
      )}
      {name === 'close' && (
        <>
          <Line x1="18" y1="6" x2="6" y2="18" {...stroke} />
          <Line x1="6" y1="6" x2="18" y2="18" {...stroke} />
        </>
      )}
    </Svg>
  );
}

export function tierIconName(tier: number): IconName {
  return tier >= 1 && tier <= 5 ? (`tier-${tier}` as IconName) : 'tier-1';
}
