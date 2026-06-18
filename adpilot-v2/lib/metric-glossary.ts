// Plain-English explanations for the metrics shown across the app. Keyed by the on-screen label
// so any surface (Key metrics, reports, command centre) can look one up. Numbers-first, AU English.
export type MetricDef = { term: string; what: string };

export const METRIC_GLOSSARY: Record<string, MetricDef> = {
  "Spend": { term: "Ad spend", what: "Total amount spent on ads in this period (AUD)." },
  "Revenue": { term: "Revenue", what: "Total sales value your tracked ads generated in this period." },
  "CPL": { term: "Cost per lead", what: "What you pay for each lead — spend ÷ leads. Lower is better." },
  "CPA": { term: "Cost per acquisition", what: "What you pay for each sale — spend ÷ purchases. Lower is better." },
  "Break-even CPA": { term: "Break-even CPA", what: "The most you can pay per sale and still not lose money (average sale value × gross margin). Stay under this." },
  "ROAS": { term: "Return on ad spend", what: "Revenue earned for every $1 spent on ads — revenue ÷ spend. Higher is better." },
  "Break-even ROAS": { term: "Break-even ROAS", what: "The ROAS you need just to cover costs (1 ÷ gross margin). Above it you profit; below it you lose money." },
  "MER": { term: "Marketing efficiency ratio", what: "Total revenue ÷ total ad spend across the whole account — a blended, account-wide ROAS." },
  "Leads": { term: "Leads", what: "Number of leads (enquiries or sign-ups) your ads generated." },
  "Purchases": { term: "Purchases", what: "Number of sales (conversions) your ads generated." },
  "CTR": { term: "Click-through rate", what: "Share of people who clicked after seeing your ad — clicks ÷ impressions." },
  "CPC": { term: "Cost per click", what: "What you pay for each click — spend ÷ clicks." },
  "CPM": { term: "Cost per mille", what: "Cost to show your ad 1,000 times — spend ÷ impressions × 1,000." },
  "Frequency": { term: "Frequency", what: "Average number of times each person saw your ads. Rising frequency with falling CTR signals fatigue." },

  // The score + health bands
  "Campaign Health Score": { term: "Campaign Health Score", what: "Your ad account's overall health, 0–100, from 13 weighted factors. 80+ Green · 60+ Yellow · 40+ Orange · under 40 Red." },
  "Data confidence": { term: "Data confidence", what: "How complete and reliable the data behind your score is (0–100). Low confidence means treat the score as a rough read." },
  "Green": { term: "Green — Healthy", what: "Score 80+. Strong and scale-eligible if your tracking is clean." },
  "Yellow": { term: "Yellow — Watch", what: "Score 60–79. Healthy overall, but fix the weak factors before you scale." },
  "Orange": { term: "Orange — At risk", what: "Score 40–59. Real issues — act this week before they cost you." },
  "Red": { term: "Red — Critical", what: "Score under 40. Stop and fix the basics before spending more." },

  // Factor-breakdown table headers
  "Factor": { term: "Factor", what: "One of the 13 things we score — e.g. tracking, CPA, creative freshness." },
  "Score": { term: "Score", what: "How this factor is doing, 0–100. Higher is better." },
  "Weight": { term: "Weight", what: "How much this factor counts toward the overall score. All 13 weights add up to 100%." },
  "Contribution": { term: "Contribution", what: "Points this factor added to your overall score (its score × its weight)." },

  // The 13 factors (keyed by their on-screen labels)
  "Tracking quality": { term: "Tracking quality", what: "How reliably your conversions are being tracked. Broken pixels/events tank this — and your decisions." },
  "CPA vs break-even": { term: "CPA vs break-even", what: "Your cost per sale against the most you can afford. Above break-even = losing money; below = profitable." },
  "Spend efficiency": { term: "Spend efficiency", what: "How much useful result you get per dollar (cheaper reach, stronger ROAS). Higher is better." },
  "Conversion rate": { term: "Conversion rate", what: "Share of clicks that became a lead or sale. Higher is better." },
  "Click-through rate": { term: "Click-through rate", what: "Share of people who clicked after seeing your ad — clicks ÷ impressions." },
  "Lead quality": { term: "Lead quality", what: "How good your leads are (from your CRM/lead events). Higher means more leads actually convert." },
  "Creative freshness (fatigue)": { term: "Creative freshness", what: "Whether your creative is still fresh. High frequency with falling CTR means fatigue — refresh it." },
  "Cost per click": { term: "Cost per click", what: "What you pay for each click — spend ÷ clicks. Lower is better." },
  "Naming convention": { term: "Naming convention", what: "How consistently your campaigns are named. Clean names make problems faster to spot and report." },
  "Offer strength": { term: "Offer strength", what: "How compelling your offer is. A stronger offer lifts conversion more than any targeting tweak." },
  "Landing-page alignment": { term: "Landing-page alignment", what: "How well your landing page matches the ad's promise. Mismatches leak conversions." },
  "Budget pacing": { term: "Budget pacing", what: "Whether budget is spent evenly vs lumpy. Erratic pacing can mean settings or delivery problems." },

  // Verdicts (what to do with each ad/campaign)
  "Fix tracking": { term: "Verdict: Fix tracking", what: "Tracking is broken or missing — fix it first so the numbers (and every other call) can be trusted." },
  "Kill": { term: "Verdict: Kill", what: "Consistently losing money with enough data to be sure — stop it and free the budget." },
  "Reduce": { term: "Verdict: Reduce", what: "Underperforming but not dead — trim spend while you improve it." },
  "Refresh": { term: "Verdict: Refresh", what: "Fatigued or stale — refresh the creative, audience, or offer and keep running." },
  "Scale": { term: "Verdict: Scale", what: "Working well and statistically significant — increase budget to get more of the result." },
};

export function metricDef(label: string): MetricDef | undefined {
  return METRIC_GLOSSARY[label];
}
