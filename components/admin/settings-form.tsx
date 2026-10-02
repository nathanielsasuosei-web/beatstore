"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

type Group = { title: string; blurb: string; fields: { key: string; label: string; type?: "text" | "textarea" }[] };

const GROUPS: Group[] = [
  {
    title: "Store identity",
    blurb: "Shown in the header, footer, page titles and emails.",
    fields: [
      { key: "site_name", label: "Store name" },
      { key: "producer_name", label: "Producer name (goes on licences)" },
      { key: "tagline", label: "Tagline" },
      { key: "announcement", label: "Homepage announcement" },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "currency", label: "Currency code (GHS, NGN, USD…)" },
    ],
  },
  {
    title: "Contact & socials",
    blurb: "Where artists reach you and where the social icons point.",
    fields: [
      { key: "support_email", label: "Support email" },
      { key: "support_phone", label: "Support phone" },
      { key: "whatsapp", label: "WhatsApp number" },
      { key: "instagram", label: "Instagram handle" },
      { key: "twitter", label: "X / Twitter handle" },
      { key: "youtube", label: "YouTube handle or URL" },
      { key: "tiktok", label: "TikTok handle" },
    ],
  },
  {
    title: "Mobile money",
    blurb: "Shown on the payment page for MoMo transfers.",
    fields: [
      { key: "momo_name", label: "Account name" },
      { key: "momo_mtn", label: "MTN MoMo number" },
      { key: "momo_telecel", label: "Telecel Cash number" },
      { key: "momo_at", label: "AT Money number" },
    ],
  },
  {
    title: "Bank transfer",
    blurb: "Shown on the payment page for bank transfers.",
    fields: [
      { key: "bank_name", label: "Bank name" },
      { key: "bank_account_name", label: "Account name" },
      { key: "bank_account_number", label: "Account number" },
      { key: "bank_branch", label: "Branch" },
    ],
  },
  {
    title: "Checkout wording",
    blurb: "Instructions and delivery notes shown to buyers.",
    fields: [
      { key: "pay_instructions", label: "Payment instructions", type: "textarea" },
      { key: "delivery_note", label: "Delivery note", type: "textarea" },
    ],
  },
];

export function SettingsForm({
  settings,
  env,
}: {
  settings: Record<string, string>;
  env: {
    paystack: boolean;
    paystackPublic: boolean;
    resend: boolean;
    emailFrom: string;
    adminEmail: string;
    siteUrl: string;
    storage: string;
    database: string;
    simulation: boolean;
  };
}) {
  const router = useRouter();
  const [values, setValues] = useState(settings);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("saving");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not save settings.");
      setState("saved");
      setMessage(`Saved ${json.saved} settings.`);
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="surface-card p-5">
        <h2 className="font-semibold">Integration status</h2>
        <p className="mt-1 text-xs text-zinc-500">
          These come from your environment variables (<code className="rounded bg-ink-800 px-1">.env</code>) —
          see <code className="rounded bg-ink-800 px-1">.env.example</code> for the full list.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatusRow
            label="Paystack secret key"
            ok={env.paystack}
            okText="Configured — live mobile money, card & bank"
            badText="Missing — checkout runs in demo mode"
          />
          <StatusRow
            label="Paystack public key"
            ok={env.paystackPublic}
            okText="Configured"
            badText="Optional unless you embed the inline widget"
          />
          <StatusRow
            label="Resend API key"
            ok={env.resend}
            okText={`Sending as ${env.emailFrom || "Resend"}`}
            badText="Missing — emails are previewed in the outbox"
          />
          <StatusRow
            label="Admin notification email"
            ok={Boolean(env.adminEmail)}
            okText={env.adminEmail}
            badText="Falling back to the support email"
          />
          <StatusRow
            label="Test payment simulation"
            ok={env.simulation}
            okText="Enabled (turn off in production)"
            badText="Disabled — real payments only"
            invert
          />
          <div className="rounded-2xl border border-ink-700 bg-ink-850 p-4 text-xs text-zinc-400">
            <p className="font-semibold text-zinc-300">Storage</p>
            <p className="mt-1">Uploads: {env.storage}/</p>
            <p>Database: {env.database}</p>
            <p>Site URL: {env.siteUrl || "http://localhost:3000"}</p>
          </div>
        </div>
      </div>

      {GROUPS.map((group) => (
        <section key={group.title} className="surface-card p-5">
          <h2 className="font-semibold">{group.title}</h2>
          <p className="mt-1 text-xs text-zinc-500">{group.blurb}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className="label" htmlFor={`setting-${field.key}`}>
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={`setting-${field.key}`}
                    rows={3}
                    className="textarea resize-y"
                    value={values[field.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  />
                ) : (
                  <input
                    id={`setting-${field.key}`}
                    className="input"
                    value={values[field.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {state === "error" && (
        <p className="flex items-center gap-2 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          <AlertCircle className="h-3.5 w-3.5" /> {message}
        </p>
      )}
      {state === "saved" && (
        <p className="flex items-center gap-2 rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs text-lime-200">
          <CheckCircle2 className="h-3.5 w-3.5" /> {message}
        </p>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <button type="submit" disabled={state === "saving"} className="btn btn-primary btn-lg shadow-xl">
          {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </button>
      </div>
    </form>
  );
}

function StatusRow({
  label,
  ok,
  okText,
  badText,
  invert,
}: {
  label: string;
  ok: boolean;
  okText: string;
  badText: string;
  invert?: boolean;
}) {
  const positive = invert ? !ok : ok;
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-850 p-4 text-xs">
      <p className="font-semibold text-zinc-300">{label}</p>
      <p className={positive ? "mt-1 text-zinc-400" : "mt-1 text-amber-300"}>{ok ? okText : badText}</p>
    </div>
  );
}
