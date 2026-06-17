// UTM & naming-convention builder — PURE, free, no AI, no DB.
// Produces consistent, sluggable campaign/ad-set/ad names plus a tagged URL, and
// validates existing names against the convention. Australian English throughout.
//
// Naming standard (lowercase, no spaces, underscore-separated):
//   campaign : {business}_{offer}_{objective}_{location}_{YYYYMMDD}
//   ad set   : {audience}_{placement}_{optimisation}
//   ad       : {angle}_{format}_{version}

export type NamesInput = {
  // Campaign parts
  business?: string;
  offer?: string;
  objective?: string;
  location?: string;
  date?: string; // ISO-ish date string or YYYYMMDD; defaults to today (UTC)
  // Ad-set parts
  audience?: string;
  placement?: string;
  optimisation?: string;
  // Ad parts
  angle?: string;
  format?: string;
  version?: string;
};

export type Names = {
  campaign: string;
  adSet: string;
  ad: string;
};

export type UrlInput = {
  url: string;
  source: string; // utm_source
  medium: string; // utm_medium
  campaign: string; // utm_campaign
  content?: string; // utm_content
  term?: string; // utm_term
};

export type ValidationIssue = {
  field: string;
  issue: string;
};

// --- slugging -------------------------------------------------------------

// Lowercase, trim, strip diacritics, collapse anything non-alphanumeric to a
// single underscore, and trim leading/trailing underscores. Australian English.
export function slug(raw: string | undefined | null): string {
  if (!raw) return "";
  return String(raw)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Normalise a date input to YYYYMMDD. Accepts YYYYMMDD, an ISO date, or a Date.
// Falls back to today (UTC) when empty/invalid.
export function toDateStamp(input?: string): string {
  const today = () => {
    const d = new Date();
    return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  };
  const v = (input || "").trim();
  if (!v) return today();
  if (/^\d{8}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return today();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
}

// --- name building --------------------------------------------------------

// Join slugged parts with underscores, dropping empties so a missing field
// doesn't leave a dangling separator.
function join(parts: (string | undefined)[]): string {
  return parts.map((p) => slug(p)).filter(Boolean).join("_");
}

export function buildNames(input: NamesInput): Names {
  return {
    campaign: join([input.business, input.offer, input.objective, input.location, toDateStamp(input.date)]),
    adSet: join([input.audience, input.placement, input.optimisation]),
    ad: join([input.angle, input.format, input.version]),
  };
}

// --- tagged URL -----------------------------------------------------------

// Build a UTM-tagged URL. Slugs the campaign/content/term values for consistency
// with the naming convention, lower-cases source/medium, preserves an existing
// query string and fragment, and never emits empty optional params.
export function buildTaggedUrl(input: UrlInput): string {
  const base = (input.url || "").trim();
  if (!base) return "";

  // Split off any fragment so we re-append it last (after the query string).
  const hashIdx = base.indexOf("#");
  const fragment = hashIdx >= 0 ? base.slice(hashIdx) : "";
  const withoutFragment = hashIdx >= 0 ? base.slice(0, hashIdx) : base;

  const params = new URLSearchParams();
  params.set("utm_source", slug(input.source));
  params.set("utm_medium", slug(input.medium));
  params.set("utm_campaign", slug(input.campaign));
  const content = slug(input.content);
  if (content) params.set("utm_content", content);
  const term = slug(input.term);
  if (term) params.set("utm_term", term);

  const sep = withoutFragment.includes("?") ? "&" : "?";
  return `${withoutFragment}${sep}${params.toString()}${fragment}`;
}

// --- validation -----------------------------------------------------------

// Validate an existing name against the convention. Flags spaces, uppercase,
// invalid characters, empty input, and (for campaigns) a missing/short part
// count. `kind` lets callers pin the expected number of underscore-separated
// fields; omit it to skip the field-count check.
export function validate(existing: string, kind?: "campaign" | "adSet" | "ad"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const value = existing ?? "";

  if (!value.trim()) {
    issues.push({ field: "name", issue: "Name is empty — provide a value." });
    return issues;
  }
  if (/\s/.test(value)) {
    issues.push({ field: "name", issue: "Contains spaces — use underscores instead." });
  }
  if (value !== value.toLowerCase()) {
    issues.push({ field: "name", issue: "Contains uppercase — names must be lowercase." });
  }
  if (/[^a-z0-9_\s]/i.test(value)) {
    issues.push({ field: "name", issue: "Contains invalid characters — use only letters, numbers and underscores." });
  }

  const expected: Record<NonNullable<typeof kind>, number> = { campaign: 5, adSet: 3, ad: 3 };
  if (kind) {
    const parts = value.trim().split(/[_\s]+/).filter(Boolean);
    if (parts.length < expected[kind]) {
      issues.push({
        field: kind,
        issue: `Missing fields — expected ${expected[kind]} parts for a ${kind === "adSet" ? "ad set" : kind} name, found ${parts.length}.`,
      });
    }
  }

  return issues;
}
