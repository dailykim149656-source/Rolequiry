import { ClaimBoard } from "@/components/case-workspace/ClaimBoard";
import { DecisionPanel } from "@/components/case-workspace/DecisionPanel";
import {
  DemoControls,
  DossierHeader,
  ProductBar,
} from "@/components/case-workspace/WorkspaceChrome";
import type { CaseSnapshot, FixtureId } from "@/lib/case-store";
import type { Importance } from "@/lib/domain/types";

type CaseWorkspaceProps = {
  readonly snapshot: CaseSnapshot;
  readonly webmcpCount: number;
  readonly cannedAnswerLabel: string | undefined;
  readonly onImportanceChange: (
    claimId: string,
    importance: Importance,
  ) => void;
  readonly onLoadFixture: (id: FixtureId) => void;
  readonly onReset: () => void;
  readonly onRank: () => void;
  readonly onRecordAnswer: (() => void) | undefined;
};

export function CaseWorkspace({
  snapshot,
  webmcpCount,
  cannedAnswerLabel,
  onImportanceChange,
  onLoadFixture,
  onReset,
  onRank,
  onRecordAnswer,
}: CaseWorkspaceProps) {
  return (
    <main className="min-h-dvh bg-canvas px-4 py-5 text-ink sm:px-6 sm:py-7 xl:px-8">
      <div className="mx-auto max-w-[90rem]">
        <ProductBar webmcpCount={webmcpCount} />
        <DossierHeader snapshot={snapshot} />
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.16fr)_minmax(23rem,0.84fr)]">
          <DecisionPanel
            className="lg:col-start-2 lg:row-start-1"
            snapshot={snapshot}
          />
          <ClaimBoard
            className="lg:col-start-1 lg:row-start-1"
            onImportanceChange={onImportanceChange}
            snapshot={snapshot}
          />
        </div>
        <DemoControls
          activeFixture={snapshot.source.id}
          cannedAnswerLabel={cannedAnswerLabel}
          onLoadFixture={onLoadFixture}
          onRank={onRank}
          onRecordAnswer={onRecordAnswer}
          onReset={onReset}
          webmcpCount={webmcpCount}
        />
      </div>
    </main>
  );
}
