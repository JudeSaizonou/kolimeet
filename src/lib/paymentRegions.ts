// Configuration des moyens de paiement par région
export const PAYMENT_REGIONS = {
  AFRICA: 'africa',
  EUROPE: 'europe',
  OTHER: 'other'
} as const;

export const AFRICAN_COUNTRIES = [
  'sn', 'ml', 'bf', 'ne', 'ci', 'gn', 'gw', 'tg', 'bj', // Afrique de l'Ouest (FCFA)
  'cm', 'cf', 'td', 'cg', 'ga', 'gq', // Afrique Centrale (FCFA)
  'ma', 'dz', 'tn', 'ly', 'eg', // Afrique du Nord
  'ng', 'gh', 'ke', 'tz', 'ug', 'rw', 'et', 'za', 'mw', 'zm' // Autres pays africains
];

export const CURRENCIES = {
  // Devises africaines
  XOF: 'XOF', // Franc CFA Ouest
  XAF: 'XAF', // Franc CFA Central  
  NGN: 'NGN', // Naira Nigeria
  GHS: 'GHS', // Cedi Ghana
  KES: 'KES', // Shilling Kenya
  TZS: 'TZS', // Shilling Tanzanie
  UGX: 'UGX', // Shilling Uganda
  RWF: 'RWF', // Franc Rwanda
  ETB: 'ETB', // Birr Ethiopie
  ZAR: 'ZAR', // Rand Afrique du Sud
  MAD: 'MAD', // Dirham Maroc
  
  // Devises internationales
  EUR: 'EUR', // Euro
  USD: 'USD', // Dollar US
  GBP: 'GBP', // Livre Sterling
} as const;

export const PAYMENT_METHODS = {
  // Cartes bancaires (international)
  STRIPE_CARD: 'stripe_card',
  
  // Mobile Money Afrique
  ORANGE_MONEY: 'orange_money',
  MTN_MONEY: 'mtn_money',
  WAVE: 'wave',
  MOOV_MONEY: 'moov_money',
  AIRTEL_MONEY: 'airtel_money',
  
  // Autres
  BANK_TRANSFER: 'bank_transfer',
} as const;

export const PAYMENT_METHOD_CONFIG = {
  [PAYMENT_METHODS.STRIPE_CARD]: {
    name: 'Carte Bancaire',
    description: 'Visa, MasterCard, American Express',
    icon: '💳',
    regions: [PAYMENT_REGIONS.EUROPE, PAYMENT_REGIONS.OTHER] as string[],
    currencies: [CURRENCIES.EUR, CURRENCIES.USD, CURRENCIES.GBP],
    fees: { percentage: 2.9, fixed: 0.30 },
    countries: undefined as string[] | undefined
  },
  
  [PAYMENT_METHODS.ORANGE_MONEY]: {
    name: 'Orange Money',
    description: 'Paiement mobile Orange',
    icon: '🧡',
    regions: [PAYMENT_REGIONS.AFRICA] as string[],
    currencies: [CURRENCIES.XOF, CURRENCIES.XAF, CURRENCIES.MAD],
    countries: ['sn', 'ml', 'bf', 'ne', 'ci', 'cm', 'ma'],
    fees: { percentage: 1.5, fixed: 0 }
  },
  
  [PAYMENT_METHODS.MTN_MONEY]: {
    name: 'MTN Mobile Money',
    description: 'Paiement mobile MTN',
    icon: '🟡',
    regions: [PAYMENT_REGIONS.AFRICA] as string[],
    currencies: [CURRENCIES.XOF, CURRENCIES.XAF, CURRENCIES.GHS, CURRENCIES.UGX],
    countries: ['ci', 'cm', 'gh', 'ug', 'rw', 'zm'],
    fees: { percentage: 1.5, fixed: 0 }
  },
  
  [PAYMENT_METHODS.WAVE]: {
    name: 'Wave',
    description: 'Portefeuille mobile Wave',
    icon: '🌊',
    regions: [PAYMENT_REGIONS.AFRICA] as string[],
    currencies: [CURRENCIES.XOF, CURRENCIES.XAF],
    countries: ['sn', 'ci', 'ml', 'bf', 'ug'],
    fees: { percentage: 1.0, fixed: 0 }
  },
  
  [PAYMENT_METHODS.MOOV_MONEY]: {
    name: 'Moov Money',
    description: 'Paiement mobile Moov',
    icon: '💙',
    regions: [PAYMENT_REGIONS.AFRICA] as string[],
    currencies: [CURRENCIES.XOF],
    countries: ['bf', 'bj', 'ci', 'tg'],
    fees: { percentage: 1.5, fixed: 0 }
  },
  
  [PAYMENT_METHODS.AIRTEL_MONEY]: {
    name: 'Airtel Money',
    description: 'Paiement mobile Airtel',
    icon: '🔴',
    regions: [PAYMENT_REGIONS.AFRICA] as string[],
    currencies: [CURRENCIES.XOF, CURRENCIES.KES, CURRENCIES.TZS, CURRENCIES.UGX],
    countries: ['ne', 'td', 'ke', 'tz', 'ug', 'rw', 'mw', 'zm'],
    fees: { percentage: 1.5, fixed: 0 }
  }
};

// Fonction pour détecter la région basée sur le pays
export const getRegionFromCountry = (countryCode: string): string => {
  const lowerCode = countryCode.toLowerCase();
  return AFRICAN_COUNTRIES.includes(lowerCode) 
    ? PAYMENT_REGIONS.AFRICA 
    : PAYMENT_REGIONS.EUROPE;
};

// Fonction pour obtenir les moyens de paiement disponibles par région/pays
export const getAvailablePaymentMethods = (countryCode: string) => {
  const region = getRegionFromCountry(countryCode);
  const lowerCode = countryCode.toLowerCase();
  
  return Object.entries(PAYMENT_METHOD_CONFIG).filter(([key, config]) => {
    // Vérifier si la méthode est disponible dans cette région
    if (!config.regions.includes(region as any)) return false;
    
    // Si la méthode spécifie des pays, vérifier la compatibilité
    if ('countries' in config && config.countries && !config.countries.includes(lowerCode)) return false;
    
    return true;
  }).map(([key, config]) => ({
    id: key,
    ...config
  }));
};

// Fonction pour obtenir la devise recommandée par pays
export const getRecommendedCurrency = (countryCode: string): string => {
  const lowerCode = countryCode.toLowerCase();
  
  // Mapping pays -> devise recommandée
  const currencyMap: Record<string, string> = {
    // Zone FCFA Ouest
    'sn': CURRENCIES.XOF, 'ml': CURRENCIES.XOF, 'bf': CURRENCIES.XOF,
    'ne': CURRENCIES.XOF, 'ci': CURRENCIES.XOF, 'gn': CURRENCIES.XOF,
    'gw': CURRENCIES.XOF, 'tg': CURRENCIES.XOF, 'bj': CURRENCIES.XOF,
    
    // Zone FCFA Central
    'cm': CURRENCIES.XAF, 'cf': CURRENCIES.XAF, 'td': CURRENCIES.XAF,
    'cg': CURRENCIES.XAF, 'ga': CURRENCIES.XAF, 'gq': CURRENCIES.XAF,
    
    // Autres pays africains
    'ng': CURRENCIES.NGN, 'gh': CURRENCIES.GHS, 'ke': CURRENCIES.KES,
    'tz': CURRENCIES.TZS, 'ug': CURRENCIES.UGX, 'rw': CURRENCIES.RWF,
    'et': CURRENCIES.ETB, 'za': CURRENCIES.ZAR, 'ma': CURRENCIES.MAD,
  };
  
  return currencyMap[lowerCode] || CURRENCIES.EUR;
};

// Configuration des commissions par méthode de paiement
export const PLATFORM_COMMISSION_RATES = {
  default: 0.05, // 5% par défaut
  [PAYMENT_METHODS.STRIPE_CARD]: 0.05, // 5% pour cartes
  [PAYMENT_METHODS.ORANGE_MONEY]: 0.04, // 4% pour Orange Money
  [PAYMENT_METHODS.MTN_MONEY]: 0.04, // 4% pour MTN
  [PAYMENT_METHODS.WAVE]: 0.03, // 3% pour Wave (plus agressif)
  [PAYMENT_METHODS.MOOV_MONEY]: 0.04,
  [PAYMENT_METHODS.AIRTEL_MONEY]: 0.04,
};

// Fonction pour calculer les frais totaux (méthode + plateforme)
export const calculateTotalFees = (
  amount: number,
  paymentMethod: string,
  currency: string = CURRENCIES.EUR
) => {
  const methodConfig = PAYMENT_METHOD_CONFIG[paymentMethod];
  const platformRate = PLATFORM_COMMISSION_RATES[paymentMethod] || PLATFORM_COMMISSION_RATES.default;
  
  if (!methodConfig) {
    throw new Error(`Méthode de paiement non supportée: ${paymentMethod}`);
  }
  
  // Frais de la méthode de paiement
  const paymentFees = (amount * methodConfig.fees.percentage / 100) + methodConfig.fees.fixed;
  
  // Commission de la plateforme
  const platformCommission = amount * platformRate;
  
  // Montant pour le voyageur
  const travelerAmount = amount - platformCommission;
  
  return {
    subtotal: amount,
    paymentFees,
    platformCommission,
    travelerAmount,
    total: amount + paymentFees,
    platformRate,
  };
};