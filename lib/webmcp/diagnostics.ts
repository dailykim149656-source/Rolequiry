export const WEBMCP_DIAGNOSTIC_STATUS = {
  LIVE: "LIVE",
  FAILED: "FAILED",
  PENDING: "PENDING",
  UNAVAILABLE: "UNAVAILABLE",
} as const;

export type WebMCPDiagnosticStatus =
  (typeof WEBMCP_DIAGNOSTIC_STATUS)[keyof typeof WEBMCP_DIAGNOSTIC_STATUS];

export type WebMCPToolDiagnostic = {
  readonly name: string;
  readonly status: WebMCPDiagnosticStatus;
};

type RegistrationState = {
  readonly supported: boolean;
  readonly registered: boolean;
  readonly error: Error | null;
};

export function webmcpToolDiagnostic(
  name: string,
  state: RegistrationState,
): WebMCPToolDiagnostic {
  const status = state.registered
    ? WEBMCP_DIAGNOSTIC_STATUS.LIVE
    : state.error
      ? WEBMCP_DIAGNOSTIC_STATUS.FAILED
      : state.supported
        ? WEBMCP_DIAGNOSTIC_STATUS.PENDING
        : WEBMCP_DIAGNOSTIC_STATUS.UNAVAILABLE;
  return { name, status };
}
