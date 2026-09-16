import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useColors } from '../constants/theme';
import { FONTS } from '../constants/fonts';

interface ContactAvatarProps {
  name: string;
  photoUri?: string;
  size: number;
  borderColor?: string;
}

export default function ContactAvatar({ name, photoUri, size, borderColor }: ContactAvatarProps) {
  const colors = useColors();
  const style = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: borderColor ?? 'transparent',
    },
  ];

  if (photoUri) {
    return <Image source={{ uri: photoUri }} style={style} />;
  }

  return (
    <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardBg, borderColor: borderColor ?? colors.cardBorder }]}>
      <Text style={{ fontFamily: FONTS.displaySemiBold, fontSize: size * 0.4, color: colors.text }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
