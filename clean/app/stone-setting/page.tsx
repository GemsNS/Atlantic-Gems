import type { Metadata } from "next";
import { ServicePage } from "@/components/ServicePage";
import { SettingStyles } from "@/components/interactive/SettingStyles";

export const metadata: Metadata = {
  title: "Stone Setting",
  description:
    "Professional stone setting and resetting in Halifax, Nova Scotia, for new work and existing mounts.",
};

export default function StoneSettingPage() {
  return (
    <>
    <ServicePage
      serviceKey="setting"
      intro={
        <>
          <p>
            Setting is where a stone and its mount meet, and it is done by hand at the bench.
            We set faceted and cabochon stones into new work and into existing mounts, and we
            reset stones that have loosened or been removed.
          </p>
          <p>
            Stones are inspected before setting and again afterwards. If a stone or mount is not
            suitable for the setting proposed, we say so before proceeding.
          </p>
        </>
      }
      process={[
        {
          title: "Inspection",
          body: "Stone and mount are examined for fit, condition and any risk in setting.",
        },
        {
          title: "Estimate",
          body: "A written estimate covering the setting work and any adjustment to the mount.",
        },
        {
          title: "Setting and check",
          body: "The stone is set, the piece is cleaned, and both are inspected before return.",
        },
      ]}
    />
    <SettingStyles />
    </>
  );
}
