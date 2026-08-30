"use client";

import { useWebMCP } from "use-webmcp-tool";
import type { CaseStore } from "@/lib/case-store";
import {
  CASE_TOOL_CONTRACTS,
  getCaseState,
  getRoleClaims,
  recordInterviewAnswerTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

const emptySchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

const answerSchema = {
  type: "object",
  properties: {
    claimId: { type: "string" },
    stance: { type: "string", enum: ["SUPPORTS", "CHALLENGES", "NEUTRAL"] },
    text: { type: "string", minLength: 1 },
    speakerRole: {
      type: "string",
      enum: ["RECRUITER", "HIRING_MANAGER", "TEAM_MEMBER", "OTHER"],
    },
  },
  required: ["claimId", "stance", "text", "speakerRole"],
  additionalProperties: false,
} as const;

export function useCaseWebMCPTools(store: CaseStore) {
  const [claimsContract, stateContract, selectContract, recordContract] =
    CASE_TOOL_CONTRACTS;
  const claims = useWebMCP({
    name: claimsContract.name,
    description: claimsContract.description,
    inputSchema: emptySchema,
    annotations: claimsContract.annotations,
    execute: () => getRoleClaims(store),
  });
  const state = useWebMCP({
    name: stateContract.name,
    description: stateContract.description,
    inputSchema: emptySchema,
    annotations: stateContract.annotations,
    execute: () => getCaseState(store),
  });
  const select = useWebMCP({
    name: selectContract.name,
    description: selectContract.description,
    inputSchema: emptySchema,
    annotations: selectContract.annotations,
    execute: () => selectDecisionChanger(store),
  });
  const record = useWebMCP({
    name: recordContract.name,
    description: recordContract.description,
    inputSchema: answerSchema,
    annotations: recordContract.annotations,
    execute: (args: {
      claimId: string;
      stance: "SUPPORTS" | "CHALLENGES" | "NEUTRAL";
      text: string;
      speakerRole: "RECRUITER" | "HIRING_MANAGER" | "TEAM_MEMBER" | "OTHER";
    }) => recordInterviewAnswerTool(store, args),
  });

  return { claims, state, select, record };
}
