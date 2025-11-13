function readEnvValue(key: string): string | undefined {
  if (typeof key !== 'string' || key.length === 0) {
    return undefined;
  }

  return process.env[key];
}

export function getEnvString(key: string, defaultValue: string): string {
  const value = readEnvValue(key);
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return defaultValue;
  }

  return trimmed;
}

export function getEnvNumber(key: string, defaultValue: number): number {
  const value = readEnvValue(key);
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return defaultValue;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);

export function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = readEnvValue(key);
  const normalized = value?.trim().toLowerCase() ?? '';
  if (!normalized) {
    return defaultValue;
  }

  return TRUE_VALUES.has(normalized) ? true : false;
}
