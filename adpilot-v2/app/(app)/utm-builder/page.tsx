"use client";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { buildNames, buildTaggedUrl, validate } from "@/lib/utm";

// UTM Builder — free, pure, no AI, no DB. Live preview of names + tagged URL +
// validation against the naming convention. Australian English.

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-2xs font-bold uppercase tracking-widest text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border-subtle bg-surface p-2.5 text-sm focus-visible:shadow-ring-brand"
      />
    </label>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-3">
      <div className="text-2xs font-bold uppercase tracking-widest text-muted">{label}</div>
      <code className="mt-1 block break-all text-sm font-semibold text-ink">{value || <span className="font-normal text-muted">—</span>}</code>
    </div>
  );
}

export default function UtmBuilder() {
  // Campaign
  const [business, setBusiness] = useState("Bright Plumbing");
  const [offer, setOffer] = useState("$0 quote");
  const [objective, setObjective] = useState("leads");
  const [location, setLocation] = useState("Brisbane QLD");
  const [date, setDate] = useState("");
  // Ad set
  const [audience, setAudience] = useState("Homeowners 35-60");
  const [placement, setPlacement] = useState("feed");
  const [optimisation, setOptimisation] = useState("conversations");
  // Ad
  const [angle, setAngle] = useState("pain point");
  const [format, setFormat] = useState("UGC video");
  const [version, setVersion] = useState("v1");
  // URL
  const [url, setUrl] = useState("https://example.com.au/quote");
  const [source, setSource] = useState("facebook");
  const [medium, setMedium] = useState("paid social");
  // Validate-existing
  const [existing, setExisting] = useState("");
  const [existingKind, setExistingKind] = useState<"campaign" | "adSet" | "ad">("campaign");

  const names = useMemo(
    () => buildNames({ business, offer, objective, location, date, audience, placement, optimisation, angle, format, version }),
    [business, offer, objective, location, date, audience, placement, optimisation, angle, format, version],
  );

  const taggedUrl = useMemo(
    () => buildTaggedUrl({ url, source, medium, campaign: names.campaign, content: names.ad, term: audience }),
    [url, source, medium, names.campaign, names.ad, audience],
  );

  const issues = useMemo(() => validate(existing, existingKind), [existing, existingKind]);

  return (
    <div className="max-w-5xl animate-fade-in">
      <PageHeader
        eyebrow="Setup"
        title="UTM &amp; Naming Builder"
        subtitle="Build consistent campaign, ad-set and ad names plus a UTM-tagged URL — to the standard convention. Free, instant, nothing stored."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-ink">Campaign · <code className="text-2xs text-muted">{"{business}_{offer}_{objective}_{location}_{YYYYMMDD}"}</code></h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Business" value={business} onChange={setBusiness} placeholder="Bright Plumbing" />
              <Field label="Offer" value={offer} onChange={setOffer} placeholder="$0 quote" />
              <Field label="Objective" value={objective} onChange={setObjective} placeholder="leads" />
              <Field label="Location" value={location} onChange={setLocation} placeholder="Brisbane QLD" />
              <Field label="Date (blank = today)" value={date} onChange={setDate} placeholder="2026-06-16" />
            </div>
          </section>

          <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-ink">Ad set · <code className="text-2xs text-muted">{"{audience}_{placement}_{optimisation}"}</code></h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Audience" value={audience} onChange={setAudience} placeholder="Homeowners 35-60" />
              <Field label="Placement" value={placement} onChange={setPlacement} placeholder="feed" />
              <Field label="Optimisation" value={optimisation} onChange={setOptimisation} placeholder="conversations" />
            </div>
          </section>

          <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-ink">Ad · <code className="text-2xs text-muted">{"{angle}_{format}_{version}"}</code></h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Angle" value={angle} onChange={setAngle} placeholder="pain point" />
              <Field label="Format" value={format} onChange={setFormat} placeholder="UGC video" />
              <Field label="Version" value={version} onChange={setVersion} placeholder="v1" />
            </div>
          </section>

          <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-ink">Tagged URL</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Landing page URL" value={url} onChange={setUrl} placeholder="https://example.com.au/quote" /></div>
              <Field label="utm_source" value={source} onChange={setSource} placeholder="facebook" />
              <Field label="utm_medium" value={medium} onChange={setMedium} placeholder="paid social" />
            </div>
            <p className="mt-2 text-2xs text-muted">utm_campaign, utm_content and utm_term auto-fill from the names above.</p>
          </section>
        </div>

        {/* Live preview */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-ink">Live preview</h2>
            <div className="space-y-3">
              <Preview label="Campaign name" value={names.campaign} />
              <Preview label="Ad-set name" value={names.adSet} />
              <Preview label="Ad name" value={names.ad} />
              <Preview label="Tagged URL" value={taggedUrl} />
            </div>
          </section>

          <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
            <h2 className="mb-1 text-sm font-bold text-ink">Validate an existing name</h2>
            <p className="mb-3 text-2xs text-muted">Paste a name you already use — we'll flag spaces, wrong case, invalid characters or missing fields.</p>
            <div className="mb-3 flex gap-2">
              {(["campaign", "adSet", "ad"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setExistingKind(k)}
                  aria-pressed={existingKind === k}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${existingKind === k ? "bg-brand text-white" : "border border-border-subtle bg-surface text-muted hover:text-ink"}`}>
                  {k === "adSet" ? "Ad set" : k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
            <input
              value={existing}
              onChange={(e) => setExisting(e.target.value)}
              placeholder="e.g. Bright Plumbing Spring Sale"
              className="w-full rounded-xl border border-border-subtle bg-surface p-2.5 text-sm focus-visible:shadow-ring-brand"
            />
            {existing.trim() && (
              <div className="mt-3">
                {issues.length === 0 ? (
                  <div className="rounded-xl border border-teal/30 bg-teal/5 p-3 text-sm text-teal" role="status">
                    Looks good — matches the convention.
                  </div>
                ) : (
                  <ul className="space-y-1.5" role="alert">
                    {issues.map((i, idx) => (
                      <li key={idx} className="rounded-xl border border-band-red/30 bg-band-red/5 p-2.5 text-sm text-band-red">
                        <span className="font-semibold">{i.field}:</span> {i.issue}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
