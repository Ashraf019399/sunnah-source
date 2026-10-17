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

export interface SettingsViewData {
  storeProfile: StoreProfile;
  deliveryRules: DeliveryRuleConfig;
  integrations: IntegrationServiceItem[];
  notificationTemplates: NotificationTemplateItem[];
  adminSecurity: AdminSecurityProfile;
}
