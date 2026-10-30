"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, ChevronRight, Loader2, Save, Wrench } from "lucide-react";
import { toast } from "sonner";

type ServiceNode = { id: string; name: string; description?: string | null; children?: ServiceNode[] };
type ServiceCategory = { id: string; code: string; label: string; description?: string | null; subcategories?: ServiceNode[] };
type CoverageData = { category_ids?: string[]; subcategory_ids?: string[] };

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-request-from": "vendor",
  };
}

export default function ServiceCoveragePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const selectedNodes = useMemo(() => new Set(selectedSubcategories), [selectedSubcategories]);

  useEffect(() => {
    const load = async () => {
      try {
        const [categoriesResponse, coverageResponse] = await Promise.all([
          fetch(`${API_BASE}/api/service-hub/categories`),
          fetch(`${API_BASE}/api/service-hub/vendor/coverage`, { credentials: "include", headers: authHeaders() }),
        ]);
        const categoriesJson = await categoriesResponse.json();
        const coverageJson = await coverageResponse.json();
        if (!categoriesResponse.ok) throw new Error(categoriesJson.message || "Could not load service categories.");
        if (!coverageResponse.ok) throw new Error(coverageJson.message || "Could not load saved request coverage.");
        setCategories(categoriesJson.data || []);
        const saved: CoverageData = coverageJson.data || {};
        const categoryIds = saved.category_ids || [];
        setSelectedCategories(categoryIds);
        setSelectedSubcategories(saved.subcategory_ids || []);
        setExpandedCategories(Object.fromEntries(categoryIds.map((id) => [id, true])));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load service coverage.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const toggleNode = (node: ServiceNode, category: ServiceCategory) => {
    if (!selectedCategories.includes(category.id)) return;
    setSelectedSubcategories((current) => {
      const ids = new Set(current);
      if (ids.has(node.id)) {
        ids.delete(node.id);
        for (const child of node.children || []) ids.delete(child.id);
      } else {
        ids.add(node.id);
      }
      return [...ids];
    });
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/service-hub/vendor/coverage`, {
        method: "PUT",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({ category_ids: selectedCategories, subcategory_ids: selectedSubcategories }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save request coverage.");
      toast.success("Service request coverage saved.");
      router.back();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save request coverage.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderNode = (node: ServiceNode, category: ServiceCategory, depth = 0) => {
    const checked = selectedNodes.has(node.id);
    const hasChildren = Boolean(node.children?.length);
    return (
      <div key={node.id} className={depth > 0 ? "ml-4 border-l-2 border-emerald-100 pl-3" : ""}>
        <button
          type="button"
          disabled={!selectedCategories.includes(category.id)}
          onClick={() => toggleNode(node, category)}
          aria-pressed={checked}
          className={`group flex min-h-[54px] w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 ${
            checked
              ? "border-emerald-300 bg-emerald-50 shadow-sm"
              : "border-zinc-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
          }`}
        >
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-300 bg-white group-hover:border-emerald-400"}`}>
            {checked ? <Check size={13} /> : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-sm font-medium ${checked ? "text-emerald-950" : "text-zinc-700"}`}>{node.name}</span>
            {depth > 0 ? <span className="mt-0.5 block text-[11px] text-zinc-500">Sub-subcategory</span> : null}
          </span>
          {hasChildren ? <span className="hidden rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-500 sm:inline-flex">{node.children?.length} subtypes</span> : null}
          {checked ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">Selected</span> : null}
        </button>
        {checked && hasChildren ? (
          <div className="mt-2 space-y-2 pb-1">
            {node.children?.map((child) => renderNode(child, category, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  const assignedCategories = categories.filter((category) => selectedCategories.includes(category.id));

  return (
    <div className="min-h-screen bg-[#f6f8f7] px-4 py-5 text-sm sm:px-6 sm:py-8">
      <main className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center gap-3 sm:mb-7">
          <button type="button" onClick={() => router.back()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800" aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Vendor settings</p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">Request coverage</h1>
          </div>
          <Link href="/services" className="ml-auto hidden text-xs font-semibold text-zinc-500 transition hover:text-emerald-700 sm:block">Back to services</Link>
        </div>

        <section className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 p-5 text-white shadow-lg shadow-emerald-950/10 sm:mb-7 sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[32px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-24 right-32 h-48 w-48 rounded-full bg-teal-400/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-50">
                <Wrench size={13} /> Service matching
              </div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Choose the work you can take on</h2>
              <p className="mt-2 max-w-xl text-xs leading-5 text-emerald-50/80 sm:text-sm">
                Your admin-approved main categories are fixed. Choose the subcategories and sub-subcategories that match the work you accept.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <div className="min-w-[112px] rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-100/75">Main categories</p>
                <p className="mt-1 text-xl font-bold">{selectedCategories.length}</p>
              </div>
              <div className="min-w-[112px] rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-100/75">Work types</p>
                <p className="mt-1 text-xl font-bold">{selectedSubcategories.length}</p>
              </div>
            </div>
          </div>
          <div className="relative mt-5 flex items-center gap-2 text-[11px] text-emerald-100/75">
            <Check size={14} className="text-emerald-300" /> Main categories are managed by the administrator
          </div>
        </section>

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3.5 text-xs leading-5 text-sky-950 sm:mb-6">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">i</span>
          <p><strong className="font-semibold">Select both levels for precise matching.</strong> To receive a request with a sub-subcategory, select its parent subcategory and the matching sub-subcategory. Changing these selections applies to new requests; requests already sent to you stay in your quotations.</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-white" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500"><Wrench size={21} /></div>
            <h2 className="mt-4 font-semibold text-zinc-900">No service categories available</h2>
            <p className="mt-1 text-xs text-zinc-500">Ask your administrator to add or activate the service categories you provide.</p>
          </div>
        ) : assignedCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500"><Wrench size={21} /></div>
            <h2 className="mt-4 font-semibold text-zinc-900">No main service categories assigned</h2>
            <p className="mt-1 text-xs text-zinc-500">Your service categories are managed during vendor approval. Contact the administrator to change them.</p>
          </div>
        ) : (
          <div className="grid items-start gap-4 md:grid-cols-2">
            {assignedCategories.map((category) => {
              const expanded = expandedCategories[category.id];
              const selectedInCategory = (category.subcategories || []).reduce((count, node) => count + (selectedNodes.has(node.id) ? 1 : 0) + (node.children || []).filter((child) => selectedNodes.has(child.id)).length, 0);
              return (
                <section key={category.id} className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-md shadow-emerald-950/5 ring-1 ring-emerald-50">
                  <div className="flex items-center gap-2 p-4 sm:p-5">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-emerald-700 bg-emerald-700 text-white shadow-sm"><Check size={14} strokeWidth={3} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-zinc-950">{category.label}</span>
                        {category.description ? <span className="mt-1 block text-xs leading-5 text-zinc-500">{category.description}</span> : null}
                        <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
                          Admin-approved · {selectedInCategory} work type{selectedInCategory === 1 ? "" : "s"} selected
                        </span>
                      </span>
                    </div>
                    {category.subcategories?.length ? (
                      <button type="button" onClick={() => setExpandedCategories((state) => ({ ...state, [category.id]: !state[category.id] }))} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800" aria-label={`${expanded ? "Collapse" : "Expand"} ${category.label} subcategories`}>
                        {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                      </button>
                    ) : null}
                  </div>
                  {expanded ? (
                    <div className="border-t border-zinc-100 bg-zinc-50/70 p-3 sm:p-4">
                      {category.subcategories?.length ? (
                        <div className="space-y-2.5">{category.subcategories.map((node) => renderNode(node, category))}</div>
                      ) : (
                        <p className="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-5 text-center text-xs text-zinc-500">No subcategories are configured for this category yet.</p>
                      )}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="flex items-center gap-2 text-xs text-zinc-500"><Wrench size={14} className="text-emerald-700" />Only matching service requests are sent to your quotations.</p>
          <button type="button" onClick={() => void save()} disabled={isSaving || isLoading || categories.length === 0 || assignedCategories.length === 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Saving coverage…" : "Save coverage"}
          </button>
        </div>
        <div className="mt-4 text-center sm:hidden"><Link href="/services" className="text-xs font-semibold text-emerald-800">Back to services</Link></div>
      </main>
    </div>
  );
}
