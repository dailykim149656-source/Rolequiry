// @vitest-environment jsdom
import * as React from "react"
import { afterEach, describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useWebMCP } from "use-webmcp-tool"
import { createCaseStore } from "@/lib/case-store"
import { IMPORTANCE } from "@/lib/domain/policy"
import { getCaseState, selectDecisionChanger } from "@/lib/webmcp/tools"

function installFakeModelContext() {
  const tools = new Map<string, { name: string }>()
  const registerTool = (tool: { name: string }, options: { signal?: AbortSignal } = {}) => {
    tools.set(tool.name, tool)
    options.signal?.addEventListener("abort", () => {
      if (tools.get(tool.name) === tool) tools.delete(tool.name)
    })
  }
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: { registerTool },
  })
  return tools
}

afterEach(() => {
  Reflect.deleteProperty(document, "modelContext")
})

describe("WebMCP registration wrapper", () => {
  it("registers exactly one live tool under StrictMode", () => {
    const tools = installFakeModelContext()
    renderHook(
      () =>
        useWebMCP({
          name: "get_case_state",
          description: "Return current case state",
          execute: () => ({ ok: true }),
        }),
      { wrapper: React.StrictMode },
    )
    expect(tools.size).toBe(1)
    expect([...tools.keys()]).toEqual(["get_case_state"])
  })
})

describe("CaseStore shared state", () => {
  it("returns fresh priorities from get_case_state after a UI importance change", () => {
    const store = createCaseStore()
    store.setImportance("travel", IMPORTANCE.CRITICAL)
    const state = getCaseState(store)
    const travel = state.claims.find((claim) => claim.id === "travel")
    expect(travel?.importance).toBe("CRITICAL")
    expect(state.claims.every((claim) => !("probePriority" in claim))).toBe(true)
  })

  it("reveals ranking only after select_decision_changer", () => {
    const store = createCaseStore()
    const before = getCaseState(store)
    expect(before.rankingVisible).toBe(false)
    const selected = selectDecisionChanger(store)
    expect(selected.ok).toBe(true)
    if (selected.ok) expect(selected.claim_id).toBe("technical-ownership")
    const after = store.getState()
    expect(after.rankingVisible).toBe(true)
    expect(after.activeProbeId).toBe("technical-ownership")
  })
})
