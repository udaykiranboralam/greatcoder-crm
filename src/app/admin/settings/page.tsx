"use client";

import { useEffect, useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Webhook,
  Copy,
  CheckCircle2,
  XCircle,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

interface SettingsData {
  settings: Record<string, string>;
  env: {
    aiKeyConfigured: boolean;
    whatsappUrl: string;
    whatsappVerifyToken: string;
    metaVerifyToken: string;
    metaAppSecret: string;
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<SettingsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load settings");
          return;
        }
        setData(json.data);
        setSettings(json.data.settings);
      } catch {
        setError("Failed to load settings");
      }
    };
    load();
  }, []);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const baseHost = typeof window !== "undefined" ? window.location.origin : "";

  const webhooks = data
    ? [
        {
          name: "Meta Lead Ads",
          url: `${baseHost}/api/webhooks/meta`,
          token: data.env.metaVerifyToken
            ? `${data.env.metaVerifyToken.slice(0, 4)}****`
            : "Not configured",
        },
        {
          name: "WhatsApp Business",
          url: `${baseHost}/api/webhooks/whatsapp`,
          token: data.env.whatsappVerifyToken
            ? `${data.env.whatsappVerifyToken.slice(0, 4)}****`
            : "Not configured",
        },
      ]
    : [];

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Failed to save settings", variant: "destructive" });
      return;
    }
    toast({ title: "Settings saved" });
  };

  return (
    <div className="space-y-6">
      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      {/* AI API key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-4 w-4 text-red-600" />
            AI Configuration
          </CardTitle>
          <CardDescription>
            Used by the AI counselor and lead scoring engine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data ? (
            <Skeleton className="h-12 w-full" />
          ) : data.env.aiKeyConfigured ? (
            <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  AI API Key configured
                </p>
                <p className="text-xs text-emerald-700">
                  Set via the AI_API_KEY environment variable.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-4">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  AI API Key not configured
                </p>
                <p className="text-xs text-red-700">
                  Add <code className="rounded bg-red-100 px-1">AI_API_KEY</code>{" "}
                  to your environment variables.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Webhook className="h-4 w-4 text-red-600" />
            Webhook Endpoints
          </CardTitle>
          <CardDescription>
            Configure these URLs in Meta / WhatsApp Business manager.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!data ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            webhooks.map((webhook) => (
              <div
                key={webhook.name}
                className="rounded-md border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">
                    {webhook.name}
                  </p>
                  <span className="text-xs text-slate-500">
                    Verify token: {webhook.token}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {webhook.url}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copy(webhook.url, "Webhook URL")}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Basic settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-4 w-4 text-red-600" />
            Basic Settings
          </CardTitle>
          <CardDescription>
            Saved in the database and shared across the CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="institute-name">Institute Name</Label>
              <Input
                id="institute-name"
                value={settings["instituteName"] || ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, instituteName: e.target.value }))
                }
                placeholder="GreatCoder Trainings"
              />
            </div>
            <div>
              <Label htmlFor="institute-phone">Contact Phone</Label>
              <Input
                id="institute-phone"
                value={settings["contactPhone"] || ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, contactPhone: e.target.value }))
                }
                placeholder="9959011934"
              />
            </div>
            <div>
              <Label htmlFor="institute-address">Address</Label>
              <Input
                id="institute-address"
                value={settings["address"] || ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, address: e.target.value }))
                }
                placeholder="Madhapur, Hyderabad"
              />
            </div>
            <div>
              <Label htmlFor="institute-email">Support Email</Label>
              <Input
                id="institute-email"
                type="email"
                value={settings["supportEmail"] || ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, supportEmail: e.target.value }))
                }
                placeholder="admissions@greatcoder.in"
              />
            </div>
          </div>
          <Separator className="my-6" />
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving || !data}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}