export interface StoreProfile {
  nameBn: string;
  nameEn: string;
  taglineBn: string;
  websiteUrl: string;
  supportPhone: string;
  supportEmail: string;
  facebookUrl: string;
  operatingCountry: string;
  currency: string;
  sourcingOrigins: string[];
}

export interface DeliveryRuleConfig {
  insideDhakaFee: number;
  outsideDhakaFee: number;
  freeDeliveryThreshold: number;
  paymentMethod: string;
  isFromDb: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
  sourceFilePath?: string;
}

export const DEFAULT_DELIVERY_SETTINGS: DeliveryRuleConfig = {
  insideDhakaFee: 70,
  outsideDhakaFee: 130,
  freeDeliveryThreshold: 2000,
  paymentMethod: "ক্যাশ অন ডেলিভারি (COD)",
  isFromDb: false,
  updatedAt: null,
  updatedBy: null,
  sourceFilePath: "src/lib/actions/checkout-actions.ts",
};

export interface DeliverySettingsFormData {
  insideDhakaFee: number;
  outsideDhakaFee: number;
  freeDeliveryThreshold: number;
}

export interface AdminSettingsMutationResult {
  success: boolean;
  message: string;
  data?: DeliveryRuleConfig;
  fieldErrors?: {
    insideDhakaFee?: string;
    outsideDhakaFee?: string;
    freeDeliveryThreshold?: string;
  };
}

export type IntegrationHealthStatus = "connected" | "configured_unverified" | "not_configured" | "error";

export interface IntegrationServiceItem {
  id: string;
  name: string;
  category: "database" | "storage" | "payment" | "courier" | "sms";
  status: IntegrationHealthStatus;
  statusLabelBn: string;
  descriptionBn: string;
  environmentKeyPresent: boolean;
  notesBn?: string;
}

export interface NotificationTemplateItem {
  id: string;
  titleBn: string;
  channel: "sms" | "whatsapp";
  sampleMessageBn: string;
  variables: string[];
}

export interface AdminSecurityProfile {
  adminEmail: string;
  role: string;
  authProvider: string;
  resetPasswordPath: string;
}

export interface MarketingPixelSettings {
  pixelId: string;
  isEnabled: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export const DEFAULT_MARKETING_SETTINGS: MarketingPixelSettings = {
  pixelId: "2675229749603202",
  isEnabled: true,
  updatedAt: null,
  updatedBy: null,
};

export interface MarketingSettingsMutationResult {
  success: boolean;
  message: string;
  data?: MarketingPixelSettings;
  fieldError?: string;
}

export interface CourierSettings {
  provider: "steadfast";
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  isConfigured: boolean;
  currentBalance?: number;
  formattedBalance?: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export const DEFAULT_COURIER_SETTINGS: CourierSettings = {
  provider: "steadfast",
  apiKey: "",
  secretKey: "",
  baseUrl: "https://portal.steadfast.com.bd/api/v1",
  isConfigured: false,
  updatedAt: null,
  updatedBy: null,
};

export const MASKED_SECRET = "••••••••••••••••";

/**
 * Checks if a secret key input string represents a masked placeholder.
 */
export function isMaskedSecret(key?: string | null): boolean {
  if (!key) return false;
  const clean = key.trim();
  return (
    clean.includes("••••") ||
    clean === MASKED_SECRET ||
    /^[•*.\s]{4,}$/.test(clean)
  );
}

export interface CourierSettingsMutationResult {
  success: boolean;
  message: string;
  data?: CourierSettings;
  fieldErrors?: {
    apiKey?: string;
    secretKey?: string;
  };
}

export interface SettingsViewData {
  storeProfile: StoreProfile;
  deliveryRules: DeliveryRuleConfig;
  integrations: IntegrationServiceItem[];
  notificationTemplates: NotificationTemplateItem[];
  adminSecurity: AdminSecurityProfile;
  marketing: MarketingPixelSettings;
  courier?: CourierSettings;
}

