"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { enquiryTypes as allEnquiryTypes, site, type EnquiryType } from "@/lib/site";
import { currentCsrfCookie } from "@/lib/csrf-cookie";

const FIELD_ORDER = ["name", "email", "phone", "type", "message", "consent"] as const;

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "ok" }
  | { state: "error"; message: string; fallback?: boolean };

/**
 * The enquiry form. Without JavaScript, or before the page has hydrated, it is
 * a plain POST to /api/contact, which answers with a redirect back to /contact
 * and a fixed status the page words. With JavaScript it posts over fetch, so a
 * mistake never costs the customer what they typed.
 */
export function ContactForm({
  csrf,
  defaultType = "other",
  defaultMessage = "",
  types = allEnquiryTypes,
}: {
  csrf: string;
  defaultType?: EnquiryType;
  defaultMessage?: string;
  types?: typeof allEnquiryTypes | { value: EnquiryType; label: string }[];
}) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const [token, setToken] = useState(csrf);
  // Browser validation stays on until hydration, so a native POST still
  // checks the required fields and the email format before leaving the page.
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => setEnhanced(true), []);

  // Move focus to what needs attention: the first invalid field, otherwise the
  // status message, so keyboard and screen-reader users are not left behind.
  useEffect(() => {
    if (status.state === "ok" || status.state === "error") {
      const first = FIELD_ORDER.find((f) => errors[f]);
      const el = first ? (formRef.current?.elements.namedItem(first) as HTMLElement | null) : null;
      (el ?? statusRef.current)?.focus();
    }
  }, [status, errors]);

  const describe = (field: string) =>
    errors[field] ? { "aria-invalid": true as const, "aria-describedby": `${field}-error` } : {};
  const errorFor = (field: string) =>
    errors[field] ? (
      <span className="error" id={`${field}-error`}>
        {errors[field]}
      </span>
    ) : null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setStatus({ state: "sending" });
    setErrors({});

    const body = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      type: String(fd.get("type") ?? ""),
      message: String(fd.get("message") ?? ""),
      consent: fd.get("consent") === "on",
      updates: fd.get("updates") === "on",
      company_website: String(fd.get("hp_note") ?? ""),
      csrf: token,
    };
    type Reply = {
      ok?: boolean;
      code?: string;
      errors?: Record<string, string>;
      message?: string;
      fallback?: boolean;
    };
    const send = async () => {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as Reply;
      return { res, data };
    };

    try {
      let { res, data } = await send();
      // An expired token: the server set a fresh cookie on that response, so
      // retry once with it rather than asking the customer to reload, which
      // would clear the message box.
      if (res.status === 403 && data.code === "csrf") {
        const fresh = currentCsrfCookie();
        if (fresh && fresh !== body.csrf) {
          setToken(fresh);
          body.csrf = fresh;
          ({ res, data } = await send());
        }
      }
      if (res.ok && data.ok) {
        setStatus({ state: "ok" });
        form.reset();
        return;
      }
      if (data.errors) setErrors(data.errors);
      setStatus({
        state: "error",
        message: data.message ?? "We could not send your enquiry. Please try again.",
        fallback: data.fallback,
      });
    } catch {
      setStatus({
        state: "error",
        message: "We could not reach the server. Please try again or email us directly.",
        fallback: true,
      });
    }
  }

  if (status.state === "ok") {
    return (
      <div className="form-status ok" role="status" tabIndex={-1} ref={statusRef}>
        <strong>Thank you.</strong> Your enquiry has been received and we will reply by email.
      </div>
    );
  }

  return (
    <form
      className="form"
      action="/api/contact"
      method="post"
      onSubmit={onSubmit}
      noValidate={enhanced}
      ref={formRef}
    >
      <input type="hidden" name="csrf" value={token} />
      <div className="field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          {...describe("name")}
        />
        {errorFor("name")}
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
          {...describe("email")}
        />
        {errorFor("email")}
      </div>

      <div className="field">
        <label htmlFor="phone">Phone (optional)</label>
        {/* The same rule as the server's (lib/validation.ts), so a plain POST
            is stopped here rather than sent back blank. */}
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={40}
          pattern="[0-9+\(\)\-\s.]*"
          title="Digits, spaces and + ( ) - . only"
          {...describe("phone")}
        />
        {errorFor("phone")}
      </div>

      <div className="field">
        <label htmlFor="type">Enquiry</label>
        <select id="type" name="type" defaultValue={defaultType} {...describe("type")}>
          {types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {errorFor("type")}
      </div>

      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          defaultValue={defaultMessage}
          placeholder="Tell us about the piece, stone or timepiece, and what you would like done."
          {...describe("message")}
        />
        {errorFor("message")}
      </div>

      <div className="hp" aria-hidden="true">
        <label htmlFor="hp_note">Leave this field empty</label>
        <input id="hp_note" name="hp_note" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="check">
        <input type="checkbox" name="consent" required {...describe("consent")} />
        <span>
          I consent to {site.name} contacting me about this enquiry. Details are used only to
          respond and are handled as described in our privacy policy.
        </span>
      </label>
      {errorFor("consent")}

      <label className="check">
        <input type="checkbox" name="updates" />
        <span>
          I would also like occasional updates about new stones and atelier work. I can
          unsubscribe at any time.
        </span>
      </label>

      {status.state === "error" ? (
        <div className="form-status err" role="alert" tabIndex={-1} ref={statusRef}>
          {status.message}
          {status.fallback ? (
            <>
              {" "}
              Email us at <a href={`mailto:${site.email}`}>{site.email}</a>.
            </>
          ) : null}
        </div>
      ) : null}

      <div>
        <button className="btn btn-primary" type="submit" disabled={status.state === "sending"}>
          {status.state === "sending" ? "Sending…" : "Send enquiry"}
        </button>
      </div>
    </form>
  );
}
