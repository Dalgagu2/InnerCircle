import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../constants/theme';

interface ContactAvatarProps {
  name: string;
  photoUri?: string;
  size: number;
  borderColor?: string;
}

export default function ContactAvatar({ name, photoUri, size, borderColor }: ContactAvatarProps) {
  const style = [
    styles.avatar,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderColor: borderColor ?? 'transparent',
    },
  ];

  if (photoUri) {
    return <Image source={{ uri: photoUri }} style={style} />;
  }

  return (
    <View style={[style, styles.fallback]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  initial: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
});
