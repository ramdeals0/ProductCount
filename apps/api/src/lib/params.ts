/** Route param helper for Express typed params */
export function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}
