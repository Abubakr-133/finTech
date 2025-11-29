// Country code to flag emoji mapping
export const countryFlags: Record<string, string> = {
  US: '🇺🇸',
  CN: '🇨🇳',
  JP: '🇯🇵',
  DE: '🇩🇪',
  IN: '🇮🇳',
  UK: '🇬🇧',
  FR: '🇫🇷',
  IT: '🇮🇹',
  BR: '🇧🇷',
  CA: '🇨🇦',
  RU: '🇷🇺',
  KR: '🇰🇷',
  AU: '🇦🇺',
  MX: '🇲🇽',
  ES: '🇪🇸',
  ID: '🇮🇩',
  SA: '🇸🇦',
  TR: '🇹🇷',
  NL: '🇳🇱',
  CH: '🇨🇭',
  PL: '🇵🇱',
  SE: '🇸🇪',
  BE: '🇧🇪',
  TH: '🇹🇭',
  IE: '🇮🇪',
  AT: '🇦🇹',
  NG: '🇳🇬',
  IL: '🇮🇱',
  SG: '🇸🇬',
  AE: '🇦🇪',
  MU: '🇲🇺', // Mauritius
}

export function getCountryFlag(code: string): string {
  return countryFlags[code] || '🌍'
}

