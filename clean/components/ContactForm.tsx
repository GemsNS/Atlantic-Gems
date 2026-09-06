"use client";

import { useState, type FormEvent } from "react";
import { enquiryTypes, site, type EnquiryType } from "@/lib/site";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "ok" }
  | { state: "error"; message: string; fallback?: boolean };

export function ContactForm({
  csrf,
  defaultType = "jewellery",
  defaultMessage = "",
}: {
  csrf: string;
  defaultType?: EnquiryType;
  defaultMessage?: string;
}) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      company_website: String(fd.get("company_website") ?? ""),
      csrf,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        errors?: Record<string, string>;
        message?: string;
        fallback?: boolean;
      };
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
      <div className="form-status ok" role="status">
        <strong>Thank you.</strong> Your enquiry has been received and we will reply by email.
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" autoComplete="name" required maxLength={120} />
        {errors.name ? <span className="error">{errors.name}</span> : null}
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required maxLength={200} />
        {errors.email ? <span className="error">{errors.email}</span> : null}
      </div>

      <div className="field">
        <label htmlFor="phone">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40} />
        {errors.phone ? <span className="error">{errors.phone}</span> : null}
      </div>

      <div className="field">
        <label htmlFor="type">Enquiry</label>
        <select id="type" name="type" defaultValue={defaultType}>
          {enquiryTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
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
        />
        {errors.message ? <span className="error">{errors.message}</span> : null}
      </div>

      <div className="hp" aria-hidden="true">
        <label htmlFor="company_website">Leave this field empty</label>
        <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="check">
        <input type="checkbox" name="consent" required />
        <span>
          I consent to {site.name} contacting me about this enquiry. Details are used only to
          respond and are handled as described in our privacy policy.
        </span>
      </label>
      {errors.consent ? <span className="error">{errors.consent}</span> : null}

      <label className="check">
        <input type="checkbox" name="updates" />
        <span>
          I would also like occasional updates about new stones and atelier work. I can
          unsubscribe at any time.
        </span>
      </label>

      {status.state === "error" ? (
        <div className="form-status err" role="alert">
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
