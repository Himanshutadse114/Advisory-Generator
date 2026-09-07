const REPO_RAW = 'https://raw.githubusercontent.com/Himanshutadse114/Advisory-Generator/main/'

const files = [
  'Identity theft.webp',
  'Pretexting-2.webp',
  'contest scam trap.webp',
  'cyberstalking.webp',
  'email security.webp',
  'fake applications fraud.webp',
  'fake helpline scam.webp',
  'juice jacking.webp',
  'maliciouis attachment.webp',
  'malware.webp',
  'man in the middle attack.webp',
  'mfa.webp',
  'mobile payment fraud.webp',
  'mobile security.webp',
  'phishing scams.webp',
  'pretexting.webp',
  'quid pro quo.webp',
  'safe usage of bots.webp',
  'sms-whatsapp scam.webp',
  'social engineering tricks.webp',
  'social engineering-smishing.webp',
  'social engineering.webp',
  'tax fraud.webp',
  'virus protection.webp',
  'vishing.webp'
]

const prettyName = file => file
  .replace(/\.webp$/i, '')
  .replace(/-2$/i, '')
  .replace(/\b\w/g, character => character.toUpperCase())

export const advisoryReferences = files.map((file, index) => ({
  id: `reference-${index + 1}`,
  file,
  title: prettyName(file),
  url: `${REPO_RAW}${file.split('/').map(encodeURIComponent).join('/')}`
}))
