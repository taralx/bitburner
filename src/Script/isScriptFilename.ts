export const validScriptExtensions: Array<string> = [`.js`, `.script`, `.ns`, `.ts`];

export function isScriptFilename(f: string): boolean {
  return validScriptExtensions.some((ext) => f.endsWith(ext));
}
