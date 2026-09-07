export const BRAND_PROFILES = [
  {
    id: 'innvikta',
    name: 'Innvikta',
    primary: '#F36C21',
    primaryDark: '#D95312',
    ink: '#1D1D1F',
    muted: '#6B6B70',
    cream: '#FFF6EF',
    paper: '#FFFCF9',
    line: '#E8DED6',
    success: '#247A5A',
    danger: '#B73E3E',
    fontFamily: 'Inter, Arial, sans-serif',
    footerText: 'Think • Verify • Report',
    logoText: 'INNVIKTA',
    logoDataUrl: ''
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    primary: '#1D5FD0',
    primaryDark: '#174DA8',
    ink: '#172033',
    muted: '#667085',
    cream: '#EEF4FF',
    paper: '#FFFFFF',
    line: '#DCE5F5',
    success: '#247A5A',
    danger: '#B73E3E',
    fontFamily: 'Inter, Arial, sans-serif',
    footerText: 'Pause • Check • Report',
    logoText: 'CLIENT',
    logoDataUrl: ''
  },
  {
    id: 'modern-teal',
    name: 'Modern Teal',
    primary: '#0F8B8D',
    primaryDark: '#0B6D6F',
    ink: '#172526',
    muted: '#617172',
    cream: '#EDFAF9',
    paper: '#FCFFFE',
    line: '#D8E9E8',
    success: '#247A5A',
    danger: '#B73E3E',
    fontFamily: 'Inter, Arial, sans-serif',
    footerText: 'Recognise • Verify • Report',
    logoText: 'CLIENT',
    logoDataUrl: ''
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    primary: '#2F3237',
    primaryDark: '#111317',
    ink: '#17191D',
    muted: '#646870',
    cream: '#F1F2F4',
    paper: '#FFFFFF',
    line: '#DADDE2',
    success: '#247A5A',
    danger: '#B73E3E',
    fontFamily: 'Inter, Arial, sans-serif',
    footerText: 'Stop • Verify • Report',
    logoText: 'CLIENT',
    logoDataUrl: ''
  }
]

export const getBrandProfile = id => BRAND_PROFILES.find(profile => profile.id === id) || BRAND_PROFILES[0]

export function createCustomBrand(base = BRAND_PROFILES[0]) {
  return {
    ...base,
    id: 'custom',
    name: 'Custom Client',
    logoText: 'CLIENT',
    logoDataUrl: ''
  }
}

export function sanitiseBrandProfile(profile) {
  const fallback = BRAND_PROFILES[0]
  const colour = (value, defaultValue) => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : defaultValue

  return {
    ...fallback,
    ...profile,
    primary: colour(profile?.primary, fallback.primary),
    primaryDark: colour(profile?.primaryDark, fallback.primaryDark),
    ink: colour(profile?.ink, fallback.ink),
    muted: colour(profile?.muted, fallback.muted),
    cream: colour(profile?.cream, fallback.cream),
    paper: colour(profile?.paper, fallback.paper),
    line: colour(profile?.line, fallback.line),
    logoText: String(profile?.logoText || profile?.name || 'CLIENT').slice(0, 28),
    footerText: String(profile?.footerText || fallback.footerText).slice(0, 60),
    name: String(profile?.name || 'Custom Client').slice(0, 40)
  }
}
