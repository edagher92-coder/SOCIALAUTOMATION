import "server-only";

// V7 intentionally ships without a live paid-ad writer. Keeping the boundary
// here makes every legacy caller fail closed while approval-ready drafts remain
// available for a human to apply in the advertising platform.
export class WriteDisabledError extends Error {
  constructor() {
    super("Live paid-ad execution is disabled and not available in this release. Prepare a reviewed change draft and apply it in the advertising platform.");
    this.name = "WriteDisabledError";
  }
}

export const isWriteDisabled = (error: unknown): error is WriteDisabledError =>
  error instanceof WriteDisabledError || (error instanceof Error && error.name === "WriteDisabledError");

export type AdAction = {
  platform: string;
  entity_level: string;
  external_entity_id: string;
  action: string;
  params?: unknown;
};

export function writeEnabled(): false {
  return false;
}

export async function captureState(_token: string, _action: AdAction): Promise<never> {
  throw new WriteDisabledError();
}

export async function executeAction(_token: string, _action: AdAction, _prior?: unknown): Promise<never> {
  throw new WriteDisabledError();
}

export async function revertAction(_token: string, _action: AdAction, _prior: unknown): Promise<never> {
  throw new WriteDisabledError();
}
