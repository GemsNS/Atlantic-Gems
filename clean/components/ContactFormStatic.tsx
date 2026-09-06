"use client";

import { useEffect, useState, type FormEvent } from "react";
import { enquiryTypes, site, type EnquiryType } from "@/lib/site";

/**
 * Static-hosting variant of the enquiry form. There is no server to post to,
 * so the form composes an email in the visitor's own mail app. Nothing is
 * transmitted to any third party.
 */
export function ContactFormStatic() {
  const [type, setType] = useState<EnquiryType>("jewellery");
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("type");
    const match = enquiryTypes.find((e) => e.value === t);
    if (match) setType(match.value);
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const label = enquiryTypes.find((t) => t.value === fd.get("type"))?.label ?? "Enquiry";
    const subject = `Enquiry: ${label}`;
    const body = [
      `Name: ${fd.get("name") ?? ""}`,
      `Email: ${fd.get("email") ?? ""}`,
      `Phone: ${fd.get("phone") || "not given"}`,
      `Enquiry: ${label}`,
      "",
      String(fd.get("message") ?? ""),
      "",
      "I consent to Atlantic Gems contacting me about this enquiry.",
    ].join("\n");
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form-status" role="note">
        Submitting opens a pre-filled message in your email app addressed to{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>. Nothing is sent until you press send
        there.
      </div>

      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" autoComplete="name" required maxLength={120} />
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required maxLength={200} />
      </div>

      <div className="field">
        <label htmlFor="phone">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40} />
      </div>

      <div className="field">
        <label htmlFor="type">Enquiry</label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as EnquiryType)}
        >
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about the piece, stone or timepiece, and what you would like done."
        />
      </div>

      <label className="check">
        <input type="checkbox" name="consent" required />
        <span>
          I consent to {site.name} contacting me about this enquiry. Details are used only to
          respond and are handled as described in our privacy policy.
        </span>
      </label>

      {opened ? (
        <div className="form-status ok" role="status">
          Your email app should now be open with the message ready to send. If it did not open,
          email us directly at <a href={`mailto:${site.email}`}>{site.email}</a>.
        </div>
      ) : null}

      <div>
        <button className="btn btn-primary" type="submit">
          Compose enquiry email
        </button>
      </div>
    </form>
  );
}
