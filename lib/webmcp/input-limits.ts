import { MAX_IDENTIFIER_LENGTH } from "@/lib/domain/limits";

export const WEBMCP_INPUT_LIMITS = {
  identifier: MAX_IDENTIFIER_LENGTH,
  label: 300,
  text: 5_000,
  url: 2_048,
} as const;

export function hasOversizedInput(
  fields: readonly (readonly [value: string, maxLength: number])[],
): boolean {
  return fields.some(([value, maxLength]) => [...value].length > maxLength);
}
