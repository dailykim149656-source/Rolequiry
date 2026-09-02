import {
  AUTHORITY_SCOPE,
  CASE_ORIGIN,
  CLAIM_KIND,
  IMPORTANCE,
  type RoleCase,
} from "@/lib/domain/types";

export const KESTREL_SOLUTIONS: RoleCase = {
  id: "kestrel-solutions",
  company: "Harborline Systems (synthetic demo)",
  role: "Solutions Engineer",
  sourceUrl: "https://harborline.example.com/careers/solutions-engineer",
  origin: CASE_ORIGIN.DEMO_FIXTURE,
  claims: [
    {
      id: "on-call-load",
      dimension: "On-call load",
      employerStatement: "Production on-call is rare",
      importance: IMPORTANCE.CRITICAL,
      unresolvedVariable: "How often does this team actually get paged?",
      measurableForm: "Pages per engineer in the last two quarters.",
      evidence: [
        {
          id: "oncall-employer",
          scope: AUTHORITY_SCOPE.EMPLOYER_STATED,
          stance: "SUPPORTS",
          text: "Production on-call is rare.",
        },
      ],
    },
    {
      id: "hands-on-coding",
      dimension: "Hands-on coding share",
      employerStatement: "Most solutions work is hands-on coding",
      importance: IMPORTANCE.HIGH,
      unresolvedVariable:
        "What share of the week is spent writing code versus customer enablement?",
      measurableForm:
        "Typical weekly split between coding and customer enablement.",
      evidence: [
        {
          id: "coding-employer",
          scope: AUTHORITY_SCOPE.EMPLOYER_STATED,
          stance: "SUPPORTS",
          text: "Most solutions work is hands-on coding.",
        },
        {
          id: "coding-report-1",
          scope: AUTHORITY_SCOPE.REPORTED_EXPERIENCE,
          stance: "CHALLENGES",
          text: "Synthetic report: most time was spent in customer workshops.",
        },
        {
          id: "coding-report-2",
          scope: AUTHORITY_SCOPE.REPORTED_EXPERIENCE,
          stance: "CHALLENGES",
          text: "Synthetic report: coding was limited to glue scripts.",
        },
        {
          id: "coding-report-3",
          scope: AUTHORITY_SCOPE.REPORTED_EXPERIENCE,
          stance: "CHALLENGES",
          text: "Synthetic report: enablement decks crowded out implementation.",
        },
      ],
    },
    {
      id: "remote-policy",
      dimension: "Remote policy",
      kind: CLAIM_KIND.EMPLOYER_POLICY,
      employerStatement: "Remote-first within hiring country",
      importance: IMPORTANCE.MEDIUM,
      unresolvedVariable: "Where must this person live?",
      measurableForm: "Written location policy for this requisition.",
      evidence: [
        {
          id: "remote-employer",
          scope: AUTHORITY_SCOPE.EMPLOYER_STATED,
          stance: "SUPPORTS",
          text: "Remote-first within the hiring country.",
        },
      ],
    },
    {
      id: "compensation",
      dimension: "Compensation",
      kind: CLAIM_KIND.EMPLOYER_POLICY,
      employerStatement: "$160k-$195k base",
      importance: IMPORTANCE.HIGH,
      unresolvedVariable: "What is the actual base band for this level?",
      measurableForm: "Written base range for this requisition.",
      evidence: [
        {
          id: "comp-employer",
          scope: AUTHORITY_SCOPE.EMPLOYER_STATED,
          stance: "SUPPORTS",
          text: "Base compensation is $160k-$195k.",
        },
      ],
    },
  ],
};
