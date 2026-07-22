import { redirect } from "next/navigation";

// V7 consolidates approved work into the proposal-only Fixes queue. Live paid-ad
// execution is intentionally unreachable in this release.
export default function ActionsPage() {
  redirect("/proposals");
}
