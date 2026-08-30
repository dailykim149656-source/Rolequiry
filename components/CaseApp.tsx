"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CaseWorkspace } from "@/components/CaseWorkspace";
import { createCaseStore } from "@/lib/case-store";
import { cannedInterviewAnswer } from "@/lib/demo/canned-answers";
import { useCaseWebMCPTools } from "@/lib/webmcp/use-case-tools";

export function CaseApp() {
  const store = useMemo(() => createCaseStore(), []);
  const webmcp = useCaseWebMCPTools(store);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  );
  const selected = snapshot.derived.claims.find(
    (claim) => claim.id === snapshot.activeProbeId,
  );
  const canned = selected ? cannedInterviewAnswer(selected.id) : null;
  const webmcpCount = [
    webmcp.claims,
    webmcp.state,
    webmcp.select,
    webmcp.record,
    webmcp.imported,
    webmcp.research,
  ].filter((item) => item.registered).length;

  return (
    <CaseWorkspace
      cannedAnswerLabel={canned?.buttonLabel}
      onImportanceChange={store.setImportance}
      onLoadFixture={store.loadFixture}
      onRank={store.selectDecisionChanger}
      onRecordAnswer={canned ? () => store.recordAnswer(canned) : undefined}
      onReset={store.reset}
      snapshot={snapshot}
      webmcpCount={webmcpCount}
    />
  );
}
