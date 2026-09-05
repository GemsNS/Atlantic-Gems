import type { Metadata } from "next";
import { PolicyDocument, type Policy } from "@/components/PolicyDocument";
import policies from "@/lib/policies.json";

const policy = policies.wholesale as Policy;

export const metadata: Metadata = {
  title: policy.title,
  description: policy.summary,
};

export default function WholesaleTermsPage() {
  return <PolicyDocument policy={policy} eyebrow="Trade" />;
}
