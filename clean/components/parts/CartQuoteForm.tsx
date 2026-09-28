"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { site } from "@/lib/site";
import { currentCsrfCookie } from "@/lib/csrf-cookie";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "error"; message: string; fallback?: boolean };

const FIELDS = ["name", "email", "company", "notes"] as const;
const DRAFT_KEY = "ag_quote_draft";

/**
 * The tray page reloads whenever a line is changed or removed. What the
 * customer has typed is kept for this tab only, so those edits never cost them
 * the form. The honeypot and token are never stored.
 */
function saveDraft(form: HTMLFormElement) {
  try {
    const draft: Record<string, string> = {};
    for (const f of FIELDS) {
      const el = form.elements.namedItem(f) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el?.value) draft[f] = el.value;
    }
    if (Object.keys(draft).length) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage blocked: the form still works, it just is not remembered */
  }
}

function restoreDraft(form: HTMLFormElement) {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw) as Record<string, unknown>;
    for (const f of FIELDS) {
      const el = form.elements.namedItem(f) as HTMLInputElement | HTMLTextAreaElement | null;
      const value = draft[f];
      // Never overwrite something the browser or the customer already filled.
      if (el && !el.value && typeof value === "string") el.value = value.slice(0, el.maxLength > 0 ? el.maxLength : 2000);
    }
  } catch {
    /* unreadable draft: start clean */
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * The quote-tray form. Without JavaScript it is a plain POST to the checkout
 * route; with it, the request goes over fetch so a mistake never costs the
 * customer what they typed, and focus lands on whatever needs attention.
 */
export function CartQuoteForm({ csrf, disabled }: { csrf: string; disabled: boolean }) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const statusRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [token, setToken] = useState(csrf);
  // Browser validation stays on until hydration, so the no-JS POST still
  // checks required fields and the email format before leaving the page.
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    setEnhanced(true);
    if (formRef.current) restoreDraft(formRef.current);
  }, []);

  // Focus follows the outcome once React has committed it: the first field
  // with an error, otherwise the status box. Scheduling this from the submit
  // handler could run before the box exists, since the "sending" render
  // removes it and the error render lands in a later task.
  useEffect(() => {
    if (status.state !== "error") return;
    const first = FIELDS.find((f) => errors[f]);
    const el = first ? (formRef.current?.elements.namedItem(first) as HTMLElement | null) : null;
    (el ?? statusRef.current)?.focus();
  }, [status, errors]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ state: "sending" });
    setErrors({});
    type Reply = {
      ok?: boolean;
      reference?: string;
      code?: string;
      message?: string;
      errors?: Record<string, string>;
    };
    const send = async (body: FormData) => {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      const data = (await res.json().catch(() => ({}))) as Reply;
      return { res, data };
    };
    try {
      const body = new FormData(form);
      let { res, data } = await send(body);
      // An expired token: the server set a fresh cookie on that response, so
      // retry once with it rather than asking the customer to reload.
      if (res.status === 403 && data.code === "csrf") {
        const fresh = currentCsrfCookie();
        if (fresh && fresh !== body.get("csrf")) {
          setToken(fresh);
          // The line-edit forms on this page carry the same token.
          document.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="csrf"]').forEach((el) => {
            el.value = fresh;
          });
          body.set("csrf", fresh);
          ({ res, data } = await send(body));
        }
      }
      if (res.ok && data.ok && data.reference) {
        clearDraft();
        // Full navigation so the header count and the emptied tray both refresh.
        window.location.assign(`/cart?sent=${encodeURIComponent(data.reference)}`);
        return;
      }
      setErrors(data.errors ?? {});
      setStatus({
        state: "error",
        message: data.message ?? "The tray could not be sent. Please try again.",
        // The store failure message already names the address.
        fallback: res.status >= 500 && data.code !== "store" && data.code !== "unavailable",
      });
    } catch {
      setStatus({
        state: "error",
        message: "We could not reach the server. Check your connection and try again.",
        fallback: true,
      });
    }
  }

  const describe = (field: string) =>
    errors[field]
      ? { "aria-invalid": true as const, "aria-describedby": `quote-${field}-error` }
      : {};
  const errorFor = (field: string) =>
    errors[field] ? (
      <span className="error" id={`quote-${field}-error`}>
        {errors[field]}
      </span>
    ) : null;

  return (
    <form
      ref={formRef}
      action="/api/cart/checkout"
      method="post"
      className="admin-form"
      onSubmit={onSubmit}
      onInput={(e) => saveDraft(e.currentTarget)}
      noValidate={enhanced}
    >
      <input type="hidden" name="csrf" value={token} />
      <label>
        Name
        <input name="name" required maxLength={120} autoComplete="name" {...describe("name")} />
      </label>
      {errorFor("name")}
      <label>
        Email
        <input
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          {...describe("email")}
        />
      </label>
      {errorFor("email")}
      <label>
        Company (optional)
        <input name="company" maxLength={120} autoComplete="organization" {...describe("company")} />
      </label>
      {errorFor("company")}
      <label>
        Notes
        <textarea
          name="notes"
          rows={4}
          maxLength={2000}
          placeholder="Job numbers, sizes, urgency…"
          {...describe("notes")}
        />
      </label>
      {errorFor("notes")}
      <div className="hp" aria-hidden="true">
        <label htmlFor="quote-hp-note">Leave this field empty</label>
        <input id="quote-hp-note" name="hp_note" tabIndex={-1} autoComplete="off" />
      </div>

      {status.state === "error" ? (
        <div className="form-status err" role="alert" tabIndex={-1} ref={statusRef}>
          {status.message}
          {status.fallback ? (
            <>
              {" "}
              You can also email the list to <a href={`mailto:${site.email}`}>{site.email}</a>.
            </>
          ) : null}
        </div>
      ) : null}

      <button
        className="btn btn-primary"
        type="submit"
        disabled={disabled || status.state === "sending"}
        aria-disabled={disabled || status.state === "sending"}
      >
        {status.state === "sending" ? "Sending the tray…" : "Send the tray for quotation"}
      </button>
    </form>
  );
}
