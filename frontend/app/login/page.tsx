"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_URL, setSession } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

const DEMOS = [
  ["admin@nwis.demo", "demo-admin", "Admin"],
  ["engineer@nwis.demo", "demo-engineer", "Drilling Engineer"],
  ["geologist@nwis.demo", "demo-geologist", "Geologist"],
  ["viewer@nwis.demo", "demo-viewer", "Viewer"],
];

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(values: z.infer<typeof schema>) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      form.setError("password", { message: "Invalid demo credentials" });
      return;
    }
    const data = await res.json();
    setSession(data.access_token, data.user);
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 p-6">
      <div className="w-full max-w-md bg-navy-900 border border-navy-700 rounded-xl p-6">
        <div className="text-xs uppercase tracking-widest text-accent-400">SIH 26121</div>
        <h1 className="text-xl font-semibold mt-1">eRTMAC-NWIS</h1>
        <p className="text-sm text-amber-300 mt-2">
          DEMO AUTHENTICATION — not production-grade identity. Synthetic data only.
        </p>
        <form className="mt-6 space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="block text-sm">
            Email
            <input className="mt-1 w-full bg-navy-800 border border-navy-700 rounded px-3 py-2" {...form.register("email")} />
          </label>
          <label className="block text-sm">
            Password
            <input type="password" className="mt-1 w-full bg-navy-800 border border-navy-700 rounded px-3 py-2" {...form.register("password")} />
          </label>
          {form.formState.errors.password && (
            <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
          )}
          <button className="w-full bg-accent-600 hover:bg-accent-500 rounded py-2 text-sm font-medium">Sign in</button>
        </form>
        <div className="mt-6 text-xs text-slate-400 space-y-1">
          <div className="text-slate-300 mb-1">Demo accounts</div>
          {DEMOS.map(([e, p, r]) => (
            <button
              key={e}
              className="block w-full text-left hover:text-accent-400"
              onClick={() => {
                form.setValue("email", e);
                form.setValue("password", p);
              }}
            >
              {r}: {e} / {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
