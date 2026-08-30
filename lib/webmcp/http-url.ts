export class InvalidHttpUrlError extends Error {
  readonly name = "InvalidHttpUrlError";

  constructor(readonly label: string) {
    super(`${label} must be a valid http(s) URL`);
  }
}

export function normalizeHttpUrl(value: string, label: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new InvalidHttpUrlError(label);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new InvalidHttpUrlError(label);
  }
  parsed.hash = "";
  return parsed.toString();
}
