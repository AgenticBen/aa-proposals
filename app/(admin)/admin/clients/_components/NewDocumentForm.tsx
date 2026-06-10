"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/lib/types";

interface Props {
  clients: Client[];
}

export function NewDocumentForm({ clients }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [error, setError] = useState("");

  // Auto-fill signer from client when client changes
  function handleClientChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (client) {
      setSignerName(client.name);
      setSignerEmail(client.email);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !title.trim()) {
      setError("Client and title are required.");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          title: title.trim(),
          signer_name_expected: signerName.trim() || null,
          signer_email: signerEmail.trim() || null,
        }),
      });
      if (!res.ok) {
        setError("Failed to create document.");
        return;
      }
      const { id } = await res.json();
      router.push(`/admin/d/${id}`);
    });
  }

  if (clients.length === 0) {
    return (
      <p className="font-body text-sm text-charcoal/50">
        Add a client below before creating a document.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-body text-sm font-medium text-charcoal mb-1">
          Client
        </label>
        <select
          value={clientId}
          onChange={handleClientChange}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sky"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.organization ? ` · ${c.organization}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-body text-sm font-medium text-charcoal mb-1">
          Document title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. AI Strategy Proposal — Acme Corp"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sky"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-body text-sm font-medium text-charcoal mb-1">
            Signer name (expected)
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Auto-filled from client"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sky"
          />
        </div>
        <div>
          <label className="block font-body text-sm font-medium text-charcoal mb-1">
            Signer email (expected)
          </label>
          <input
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            placeholder="Auto-filled from client"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sky"
          />
        </div>
      </div>

      {error && <p className="font-body text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="bg-cyan text-navy font-body font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-cyan/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Creating…" : "Create document"}
      </button>
    </form>
  );
}
