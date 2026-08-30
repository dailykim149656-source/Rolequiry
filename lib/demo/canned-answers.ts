import {
  type EvidenceStance,
  SPEAKER_ROLE,
  type SpeakerRole,
} from "@/lib/domain/types";

export type CannedInterviewAnswer = {
  readonly claimId: string;
  readonly stance: EvidenceStance;
  readonly text: string;
  readonly speakerRole: SpeakerRole;
  readonly buttonLabel: string;
};

const ANSWERS: Record<string, CannedInterviewAnswer> = {
  "technical-ownership": {
    claimId: "technical-ownership",
    stance: "CHALLENGES",
    text: "Hiring manager said ownership is split with a central platform team after design review.",
    speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    buttonLabel: "Record ownership answer",
  },
};

export function cannedInterviewAnswer(
  claimId: string,
): CannedInterviewAnswer | null {
  return ANSWERS[claimId] ?? null;
}
