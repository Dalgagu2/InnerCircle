import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface ActivitySearch {
  hobby: string;
  mapsUrl: string;
}

export interface DeviceCoords {
  latitude: number;
  longitude: number;
}

const MAX_HOBBIES = 4;

export function parseHobbies(hobbies: string | undefined): string[] {
  return (hobbies || '')
    .split(/,|\n|&|\/|\band\b/i)
    .map(h => h.trim())
    .filter(h => h.length > 0)
    .filter((h, i, arr) => arr.findIndex(x => x.toLowerCase() === h.toLowerCase()) === i)
    .slice(0, MAX_HOBBIES);
}

// Friend's saved zip code wins (e.g. planning a visit to their city); falling back to
// the device's current location keeps the feature useful when it isn't set.
export async function requestDeviceLocation(): Promise<DeviceCoords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
}

function buildMapsUrl(query: string): string {
  const encoded = encodeURIComponent(query);
  // Hand the search off to whichever maps app the OS considers the user's own.
  if (Platform.OS === 'ios') {
    return `https://maps.apple.com/?q=${encoded}`;
  }
  if (Platform.OS === 'android') {
    return `geo:0,0?q=${encoded}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

export function buildActivitySearches(
  hobbies: string | undefined,
  zipCode: string | undefined,
  coords: DeviceCoords | null,
): ActivitySearch[] {
  const zip = (zipCode || '').trim();
  const locationSuffix = zip ? ` near ${zip}` : coords ? ` near ${coords.latitude},${coords.longitude}` : '';

  return parseHobbies(hobbies).map(hobby => ({
    hobby,
    mapsUrl: buildMapsUrl(`${hobby}${locationSuffix}`),
  }));
}
