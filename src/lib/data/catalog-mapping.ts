const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(val: string): boolean {
  return UUID_REGEX.test(val);
}

export const PRODUCT_ID_MAP: Record<string, string> = {
  "prod-h-1": "a8a4757a-70c1-48a4-bd95-69e2de9cb294",
  "prod-g-1": "2e0acca0-d6a4-4ce1-8097-2873c9a163fb",
  "prod-o-1": "9d3f1a23-ab3e-4b8b-8789-f98143b2197c",
  "prod-d-1": "3d91069e-7ec7-4fcc-922c-5e3e6331f187",
};

export const VARIANT_ID_MAP: Record<string, string> = {
  "var-h1-250": "43b54046-a65a-454f-bca2-7065856feb13",
  "var-h1-500": "23d24576-8517-45a3-8360-f3e86b5be4aa",
  "var-h1-1000": "15226d57-fb5b-4430-9839-840f0229c20e",
  "var-g1-400": "46c7bb0b-9700-4707-8f3d-c6cbae3b291b",
  "var-g1-900": "7bed8de7-5b24-4d4b-9c53-f2078f7d0d17",
  "var-o1-1l": "b833a4f9-c9c0-4381-8916-39b405144d86",
  "var-o1-5l": "dedd1c6c-0647-46bb-a168-08e3941d7f9a",
  "var-d1-500": "b146b22b-fbf2-4ee9-84f0-406b5fa07c44",
  "var-d1-1000": "6756df9d-3d90-4b2c-9641-286992895c58",
};

export function resolveProductDbId(id: string): string | null {
  if (!id) return null;
  if (isUuid(id)) return id;
  return PRODUCT_ID_MAP[id] ?? null;
}

export function resolveVariantDbId(id: string): string | null {
  if (!id) return null;
  if (isUuid(id)) return id;
  return VARIANT_ID_MAP[id] ?? null;
}
