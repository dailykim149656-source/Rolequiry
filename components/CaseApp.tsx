"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { CaseWorkspace } from "@/components/CaseWorkspace";
import {
  createCaseExport,
  loadPersistedCase,
  parseImportedCaseFile,
  savePersistedCase,
} from "@/lib/case-persistence";
import { createCaseStore } from "@/lib/case-store";
import { cannedInterviewAnswer } from "@/lib/demo/canned-answers";
import { MAX_CASE_FILE_BYTES } from "@/lib/domain/limits";
import { CASE_TOOL_CONTRACTS } from "@/lib/webmcp/contracts";
import { webmcpToolDiagnostic } from "@/lib/webmcp/diagnostics";
import { useCaseWebMCPTools } from "@/lib/webmcp/use-case-tools";

const SESSION_PERSISTENCE_WARNING =
  "Case imported, but this browser could not keep it for refresh. Keep the JSON file to restore it.";

export function CaseApp() {
  const store = useMemo(() => createCaseStore(), []);
  const caseImportSequence = useRef(0);
  const [caseFileStatus, setCaseFileStatus] = useState<{
    readonly error: boolean;
    readonly message: string;
  } | null>(null);
  const webmcp = useCaseWebMCPTools(store);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  );
  useEffect(() => {
    const saved = loadPersistedCase(window.sessionStorage);
    if (saved) store.restore(saved);
    const persist = () => {
      if (savePersistedCase(window.sessionStorage, store.getState())) return;
      setCaseFileStatus({
        error: true,
        message: SESSION_PERSISTENCE_WARNING,
      });
    };
    persist();
    return store.subscribe(persist);
  }, [store]);
  const selected = snapshot.derived.claims.find(
    (claim) => claim.id === snapshot.activeProbeId,
  );
  const canned = selected ? cannedInterviewAnswer(selected.id) : null;
  const registrations = [
    [CASE_TOOL_CONTRACTS[0].name, webmcp.claims],
    [CASE_TOOL_CONTRACTS[1].name, webmcp.state],
    [CASE_TOOL_CONTRACTS[2].name, webmcp.select],
    [CASE_TOOL_CONTRACTS[3].name, webmcp.record],
    [CASE_TOOL_CONTRACTS[4].name, webmcp.imported],
    [CASE_TOOL_CONTRACTS[5].name, webmcp.research],
    [CASE_TOOL_CONTRACTS[6].name, webmcp.priorities],
  ] as const;
  const webmcpCount = registrations.filter(
    ([, state]) => state.registered,
  ).length;
  const webmcpDiagnostics = registrations.map(([name, state]) =>
    webmcpToolDiagnostic(name, state),
  );
  const exportCase = () => {
    let objectUrl: string | null = null;
    try {
      const exported = createCaseExport(snapshot);
      objectUrl = URL.createObjectURL(
        new Blob([exported.contents], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.download = exported.filename;
      link.href = objectUrl;
      document.body.append(link);
      link.click();
      link.remove();
      setCaseFileStatus({
        error: false,
        message: "Case JSON exported locally.",
      });
    } catch {
      setCaseFileStatus({
        error: true,
        message: "Could not export this case.",
      });
    } finally {
      if (objectUrl) {
        const urlToRevoke = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(urlToRevoke), 0);
      }
    }
  };
  const importCase = async (file: File) => {
    const sequence = caseImportSequence.current + 1;
    caseImportSequence.current = sequence;
    if (file.size > MAX_CASE_FILE_BYTES) {
      setCaseFileStatus({
        error: true,
        message: "Could not import this Rolequiry JSON file.",
      });
      return;
    }
    try {
      const saved = parseImportedCaseFile(await file.text());
      if (sequence !== caseImportSequence.current) return;
      if (!saved) throw new Error("Invalid case file");
      store.restore(saved);
      const persisted = savePersistedCase(
        window.sessionStorage,
        store.getState(),
      );
      setCaseFileStatus({
        error: !persisted,
        message: persisted
          ? "Case imported from local JSON."
          : SESSION_PERSISTENCE_WARNING,
      });
    } catch {
      if (sequence !== caseImportSequence.current) return;
      setCaseFileStatus({
        error: true,
        message: "Could not import this Rolequiry JSON file.",
      });
    }
  };

  return (
    <CaseWorkspace
      caseFileError={caseFileStatus?.error ?? false}
      caseFileMessage={caseFileStatus?.message ?? null}
      cannedAnswerLabel={canned?.buttonLabel}
      onExportCase={exportCase}
      onImportanceChange={store.setImportance}
      onImportCase={importCase}
      onLoadFixture={store.loadFixture}
      onRank={store.selectDecisionChanger}
      onRecordAnswer={canned ? () => store.recordAnswer(canned) : undefined}
      onReset={store.reset}
      snapshot={snapshot}
      webmcpCount={webmcpCount}
      webmcpDiagnostics={webmcpDiagnostics}
    />
  );
}
