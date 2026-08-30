import {
  deriveCase,
  recordInterviewAnswer,
  setClaimImportance,
} from "@/lib/domain/derive-case";
import type {
  DerivedCase,
  Importance,
  InterviewAnswerInput,
  RoleCase,
} from "@/lib/domain/types";
import { ATLAS_FDE } from "@/lib/fixtures/atlas-fde";
import { KESTREL_SOLUTIONS } from "@/lib/fixtures/kestrel-solutions";

export const FIXTURES = {
  "atlas-fde": ATLAS_FDE,
  "kestrel-solutions": KESTREL_SOLUTIONS,
} as const;

export type FixtureId = keyof typeof FIXTURES;

export type CaseSnapshot = {
  readonly source: RoleCase;
  readonly derived: DerivedCase;
  readonly activeProbeId: string | null;
  readonly rankingVisible: boolean;
};

type Listener = () => void;

function snapshotFrom(
  source: RoleCase,
  activeProbeId: string | null,
  rankingVisible: boolean,
): CaseSnapshot {
  return {
    source,
    derived: deriveCase(source),
    activeProbeId,
    rankingVisible,
  };
}

export function createCaseStore(initial: RoleCase = ATLAS_FDE) {
  let state = snapshotFrom(initial, null, false);
  const listeners = new Set<Listener>();

  function emit() {
    for (const listener of listeners) listener();
  }

  return {
    getState(): CaseSnapshot {
      return state;
    },
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    loadFixture(id: FixtureId) {
      state = snapshotFrom(FIXTURES[id], null, false);
      emit();
    },
    reset() {
      const fixture = FIXTURES[state.source.id as FixtureId] ?? ATLAS_FDE;
      state = snapshotFrom(fixture, null, false);
      emit();
    },
    setImportance(claimId: string, importance: Importance) {
      state = snapshotFrom(
        setClaimImportance(state.source, claimId, importance),
        null,
        false,
      );
      emit();
    },
    peekDecision() {
      return deriveCase(state.source);
    },
    clearSelection() {
      state = snapshotFrom(state.source, null, false);
      emit();
    },
    selectDecisionChanger() {
      const derived = deriveCase(state.source);
      state = {
        source: state.source,
        derived,
        activeProbeId: derived.topProbeId,
        rankingVisible: Boolean(derived.topProbeId),
      };
      emit();
      return derived;
    },
    recordAnswer(input: InterviewAnswerInput) {
      const source = recordInterviewAnswer(state.source, input);
      state = snapshotFrom(source, null, false);
      emit();
    },
  };
}

export type CaseStore = ReturnType<typeof createCaseStore>;
