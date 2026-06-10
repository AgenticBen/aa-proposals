"use client";

import { useState, useTransition } from "react";
import type { Client } from "@/lib/types";

interface Props {
  initialClients: Client[];
}

function emptyForm() {
  return { name: "", email: "", organization: "", notes: "" };
}

export function ClientsManager({ initialClients }: Props) {
  const [clients, setClients] = useState(initialClients);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm());
  const [addError, setAddError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setAddError("Name and email are required.");
      return;
    }
    setAddError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          organization: form.organization.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      if (!res.ok) { setAddError("Failed to create client."); return; }
      const { client } = await res.json();
      setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(emptyForm());
    });
  }

  function startEdit(client: Client) {
    setEditingId(client.id);
    setEditForm({
      name: client.name,
      email: client.email,
      organization: client.organization ?? "",
      notes: client.notes ?? "",
    });
  }

  async function handleSaveEdit(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          organization: editForm.organization.trim() || null,
          notes: editForm.notes.trim() || null,
        }),
      });
      if (!res.ok) return;
      const { client: updated } = await res.json();
      setClients((prev) =>
        prev
          .map((c) => (c.id === id ? updated : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete. The client may have documents attached.");
        return;
      }
      setClients((prev) => prev.filter((c) => c.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      {/* Client list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-body text-sm text-charcoal/50">No clients yet.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">Name</th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">Email</th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">Organization</th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) =>
                editingId === client.id ? (
                  <tr key={client.id} className="border-b border-gray-100 bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sky"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sky"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editForm.organization}
                        onChange={(e) => setEditForm((f) => ({ ...f, organization: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sky"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(client.id)}
                          disabled={isPending}
                          className="font-body text-xs text-green-600 hover:underline disabled:opacity-40"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="font-body text-xs text-charcoal/50 hover:text-charcoal"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-body text-sm font-medium text-navy">
                      {client.name}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-charcoal">
                      {client.email}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-charcoal/60">
                      {client.organization ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(client)}
                          className="font-body text-xs text-sky hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(client.id, client.name)}
                          disabled={isPending}
                          className="font-body text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add client form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-display text-lg text-navy mb-4">Add client</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm font-medium text-charcoal mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-charcoal mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-charcoal mb-1">
                Organization
              </label>
              <input
                type="text"
                value={form.organization}
                onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-charcoal mb-1">
                Notes
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
          </div>
          {addError && <p className="font-body text-sm text-red-600">{addError}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="bg-navy text-white font-body font-medium text-sm px-5 py-2 rounded-xl hover:bg-navy/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Adding…" : "Add client"}
          </button>
        </form>
      </div>
    </div>
  );
}
