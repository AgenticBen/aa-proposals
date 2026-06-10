"use client";

import { useState, useTransition } from "react";
import type { Section } from "@/lib/types";

interface Props {
  documentId: string;
  documentStatus: string;
  initialSections: Section[];
  latestVersionNumber: number;
}

export function SectionEditor({
  documentId,
  documentStatus,
  initialSections,
  latestVersionNumber,
}: Props) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [note, setNote] = useState("");
  const [visibleToClient, setVisibleToClient] = useState(false);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  const locked = documentStatus === "signed" || documentStatus === "archived";

  function updateSection(idx: number, field: keyof Section, value: string) {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  }

  function moveSection(idx: number, dir: -1 | 1) {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSections(next.map((s, i) => ({ ...s, order: i })));
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        heading: "New Section",
        body_md: "",
        order: prev.length,
      },
    ]);
  }

  function removeSection(idx: number) {
    setSections((prev) =>
      prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i }))
    );
  }

  async function handleImport() {
    const res = await fetch(`/api/admin/documents/${documentId}/import-md`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: importText }),
    });
    if (!res.ok) { alert("Import failed"); return; }
    const { sections: imported } = await res.json();
    setSections(imported);
    setImportText("");
    setShowImport(false);
  }

  async function handleSave() {
    setSaveStatus("saving");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/documents/${documentId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections, note, visible_to_client: visibleToClient }),
        });
        if (res.status === 409) {
          setSaveStatus("error");
          alert("This document is signed and cannot be modified.");
          return;
        }
        if (!res.ok) throw new Error(await res.text());
        setSaveStatus("saved");
        setNote("");
        setVisibleToClient(false);
        setTimeout(() => setSaveStatus("idle"), 2500);
        window.location.reload();
      } catch {
        setSaveStatus("error");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-charcoal/60">
          Editing from v{latestVersionNumber} — save creates a new version.
        </p>
        {!locked && (
          <button
            type="button"
            onClick={() => setShowImport((v) => !v)}
            className="font-body text-sm text-sky hover:underline"
          >
            {showImport ? "Cancel import" : "Import markdown"}
          </button>
        )}
      </div>

      {/* Import panel */}
      {showImport && !locked && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
          <p className="font-body text-sm font-medium text-charcoal">
            Paste markdown below. The text will be split on <code className="text-xs bg-gray-200 px-1 rounded">##</code> headings.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 font-body text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky"
            placeholder="# Title (ignored)&#10;&#10;## Section One&#10;Body text here..."
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={!importText.trim()}
            className="bg-navy text-white font-body text-sm px-4 py-2 rounded-xl disabled:opacity-40"
          >
            Parse and replace sections
          </button>
        </div>
      )}

      {/* Section list */}
      {locked && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 font-body text-sm text-orange-700">
          This document is {documentStatus} — content is locked.
        </div>
      )}

      <div className="space-y-3">
        {sections.map((section, idx) => (
          <div key={section.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={section.heading}
                onChange={(e) => updateSection(idx, "heading", e.target.value)}
                disabled={locked}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 font-display text-sm font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-sky disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="Section heading"
              />
              {!locked && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveSection(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-charcoal/40 hover:text-charcoal disabled:opacity-20"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 1)}
                    disabled={idx === sections.length - 1}
                    className="p-1 text-charcoal/40 hover:text-charcoal disabled:opacity-20"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(idx)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Remove section"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <textarea
              value={section.body_md}
              onChange={(e) => updateSection(idx, "body_md", e.target.value)}
              disabled={locked}
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 font-body text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky disabled:bg-gray-50 disabled:text-gray-400 resize-y"
              placeholder="Markdown body..."
            />
          </div>
        ))}
      </div>

      {!locked && (
        <>
          <button
            type="button"
            onClick={addSection}
            className="font-body text-sm text-sky hover:underline"
          >
            + Add section
          </button>

          {/* Save as new version */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 mt-2">
            <p className="font-body text-sm font-semibold text-charcoal">Save as new version</p>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Version note (optional)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sky"
            />
            <label className="flex items-center gap-2 font-body text-sm text-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={visibleToClient}
                onChange={(e) => setVisibleToClient(e.target.checked)}
                className="rounded border-gray-300 text-cyan"
              />
              Visible to client
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || saveStatus === "saving"}
              className="bg-cyan text-navy font-body font-semibold text-sm px-5 py-2 rounded-xl hover:bg-cyan/90 disabled:opacity-50 transition-colors"
            >
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved ✓" : "Save version"}
            </button>
            {saveStatus === "error" && (
              <p className="font-body text-sm text-red-600">Save failed. Check console.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
