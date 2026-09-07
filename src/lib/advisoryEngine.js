export const BRAND = {
  name: 'Innvikta', primary: '#F36C21', primaryDark: '#D95312', ink: '#1D1D1F', muted: '#6B6B70', cream: '#FFF6EF', paper: '#FFFCF9', line: '#E8DED6', success: '#247A5A', danger: '#B73E3E'
}

export const ADVISORY_TYPES = ['Internal Advisory', 'External Advisory', 'Executive Advisory']
export const AUDIENCES = ['All Employees', 'Senior Executives', 'Finance Teams', 'IT & Security Teams', 'Customers']
export const TEMPLATES = [
  { id: 'editorial', name: 'Editorial Hero', description: 'Large visual statement with balanced two-column guidance.' },
  { id: 'split', name: 'Split Story', description: 'Strong side-by-side composition for threats and actions.' },
  { id: 'flow', name: 'Threat Flow', description: 'Explains how an attack progresses before showing safeguards.' }
]

const topicRules = [
  {
    category: 'Phishing & Messaging', keywords: ['phish', 'smish', 'vish', 'email', 'attachment', 'qr', 'quish', 'message'],
    how: [
      'An attacker sends a convincing message that appears to come from a trusted person or organisation.',
      'The message creates urgency, curiosity or fear to encourage an immediate response.',
      'A link, QR code, attachment or request directs the recipient towards a fraudulent action.',
      'Information, credentials or money can be exposed when the request is followed without verification.'
    ],
    safe: [
      'Check the sender address, destination and request carefully before taking action.',
      'Verify unusual or urgent requests through a trusted contact method.',
      'Avoid opening unexpected links, QR codes or attachments without confirming their source.',
      'Report suspicious messages through the organisation’s approved reporting channel.'
    ]
  },
  {
    category: 'Identity & Access', keywords: ['identity', 'mfa', 'password', 'credential', 'account', 'login', 'authentication'],
    how: [
      'Attackers attempt to obtain or misuse credentials linked to a genuine user account.',
      'Repeated prompts, fake login pages or impersonation may be used to pressure the user.',
      'A successful sign-in can give the attacker access to systems, information or services.',
      'Compromised access may then be used for further fraud, data theft or impersonation.'
    ],
    safe: [
      'Use strong unique passwords and approved authentication methods for every account.',
      'Never approve an authentication request that you did not initiate yourself.',
      'Check unusual login alerts and account activity as soon as they appear.',
      'Report unexpected authentication prompts or suspected account compromise immediately.'
    ]
  },
  {
    category: 'Financial Fraud', keywords: ['fraud', 'money', 'payment', 'bank', 'tax', 'mule', 'invoice', 'refund', 'contest', 'prize'],
    how: [
      'A convincing offer, payment request or financial message is presented as genuine.',
      'The attacker uses urgency, authority or an attractive reward to lower suspicion.',
      'The victim is asked to transfer money, reveal banking information or receive funds.',
      'The transaction can result in financial loss or connect the victim to fraudulent activity.'
    ],
    safe: [
      'Verify financial requests independently before approving, receiving or transferring funds.',
      'Do not share banking details in response to unsolicited calls, messages or emails.',
      'Treat unexpected rewards, refunds and urgent payment changes with caution.',
      'Report suspicious financial activity to the appropriate internal team without delay.'
    ]
  },
  {
    category: 'Malware & Device Security', keywords: ['malware', 'virus', 'device', 'mobile', 'juice', 'application', 'app', 'usb'],
    how: [
      'Malicious software or unsafe access can be introduced through an untrusted file, app or connection.',
      'The threat may attempt to monitor activity, steal information or change device behaviour.',
      'Users may not immediately notice that a device or account has been affected.',
      'The compromise can spread further if the infected device connects to organisational systems.'
    ],
    safe: [
      'Install software only from approved sources and keep devices fully updated.',
      'Avoid unknown attachments, applications, charging points and removable media.',
      'Pay attention to unusual device behaviour, permissions or security warnings.',
      'Contact the security team if a device appears compromised or behaves unexpectedly.'
    ]
  },
  {
    category: 'Social Engineering', keywords: ['social engineering', 'pretext', 'impersonat', 'helpline', 'support', 'quid pro quo', 'ceo'],
    how: [
      'An attacker creates a believable identity, story or situation to gain trust.',
      'Authority, helpfulness, urgency or familiarity is used to influence the target.',
      'The target is encouraged to reveal information, provide access or perform an action.',
      'The attacker uses the information or access to continue the fraud or compromise.'
    ],
    safe: [
      'Confirm identities and unusual requests using trusted contact information.',
      'Do not allow urgency or authority to bypass established security procedures.',
      'Share sensitive information only when the requester and business need are verified.',
      'Report suspicious conversations or impersonation attempts through approved channels.'
    ]
  },
  {
    category: 'Data & Privacy', keywords: ['privacy', 'data', 'pii', 'personal information', 'confidential', 'cyberstalk'],
    how: [
      'Personal or confidential information is collected, exposed or used beyond its intended purpose.',
      'Attackers may combine information from several sources to build a convincing profile.',
      'The information can be used for impersonation, targeting, fraud or unwanted monitoring.',
      'Once information is exposed it can be difficult to control how widely it is reused.'
    ],
    safe: [
      'Share personal and confidential information only when there is a clear business need.',
      'Check privacy settings and limit unnecessary information on public platforms.',
      'Use approved systems when storing, processing or sending sensitive information.',
      'Report accidental disclosure or suspicious use of information as soon as possible.'
    ]
  },
  {
    category: 'Network Security', keywords: ['wifi', 'wi-fi', 'network', 'man in the middle', 'mitm', 'hotspot', 'router'],
    how: [
      'An unsafe or impersonated network can place an attacker between a user and the service being accessed.',
      'Traffic may be observed, redirected or altered when a connection is not properly protected.',
      'Fake hotspots can imitate trusted network names and encourage users to connect without checking.',
      'Sensitive information can be exposed when insecure networks are used for confidential activity.'
    ],
    safe: [
      'Use approved or trusted networks for work and sensitive online activity.',
      'Confirm public network names with the venue before connecting to them.',
      'Avoid sensitive transactions when a connection appears unusual or insecure.',
      'Report unexpected certificate warnings, redirects or network behaviour promptly.'
    ]
  },
  {
    category: 'AI & Emerging Technology', keywords: ['ai', 'artificial intelligence', 'genai', 'generative ai', 'chatbot', 'bot', 'deepfake', 'synthetic'],
    how: [
      'AI tools can process prompts, files or conversations that may contain sensitive business information.',
      'Generated content can be inaccurate, manipulated or convincingly imitate a real person.',
      'Unapproved tools may handle information in ways that do not match organisational requirements.',
      'Attackers can use AI-generated content to make phishing, impersonation and fraud more convincing.'
    ],
    safe: [
      'Use only approved AI tools for work and follow the organisation’s data-handling requirements.',
      'Do not enter confidential, personal or restricted information into unapproved AI services.',
      'Verify important AI-generated information before using it for business decisions.',
      'Treat realistic synthetic messages, audio or video as unverified until independently confirmed.'
    ]
  }
]

const genericRule = {
  category: 'Cybersecurity Awareness',
  how: [
    'The threat starts with an action or request that appears normal or trustworthy.',
    'Attackers use familiar technology and human behaviour to reduce suspicion.',
    'A rushed or unverified action can expose information, access or money.',
    'The incident may then affect both the individual and the wider organisation.'
  ],
  safe: [
    'Pause and check unusual requests before sharing information or taking action.',
    'Use approved systems, processes and security controls for work activities.',
    'Verify anything unexpected through a trusted and independent channel.',
    'Report suspicious activity early so the security team can respond quickly.'
  ]
}

const normaliseTopic = topic => String(topic || '').trim().replace(/\s+/g, ' ')

export function classifyTopic(topic) {
  const value = normaliseTopic(topic).toLowerCase()
  return topicRules.find(rule => rule.keywords.some(keyword => value.includes(keyword))) || genericRule
}

function createIntro(topic, audience) {
  const audiencePhrase = audience === 'Customers' ? 'customers' : 'employees'
  return `${topic} can use familiar communication, technology or behaviour to create a convincing situation. Understanding the warning signs helps ${audiencePhrase} recognise the risk early and respond safely.`
}

export function generateAdvisory({ topic, audience = AUDIENCES[0], advisoryType = ADVISORY_TYPES[0] }) {
  const cleanTopic = normaliseTopic(topic || 'Cybersecurity Awareness')
  const rule = classifyTopic(cleanTopic)
  return {
    id: `adv-${Date.now()}`,
    topic: cleanTopic,
    title: cleanTopic,
    eyebrow: advisoryType.toUpperCase(),
    audience,
    advisoryType,
    category: rule.category,
    intro: createIntro(cleanTopic, audience),
    sectionOneTitle: 'How It Works',
    sectionOnePoints: [...rule.how],
    sectionTwoTitle: 'Best Practices',
    sectionTwoPoints: [...rule.safe],
    generatedAt: new Date().toISOString()
  }
}

export function getRecommendedTemplate(category = '') {
  if (category.includes('Financial') || category.includes('Phishing') || category.includes('Network')) return 'flow'
  if (category.includes('Identity') || category.includes('Social')) return 'split'
  return 'editorial'
}
