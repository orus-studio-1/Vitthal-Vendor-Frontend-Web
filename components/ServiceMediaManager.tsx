"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ServiceMedia = {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  approval_status: string;
  removal_requested_at: string | null;
};

const statusLabel = (media: ServiceMedia) => {
  if (media.removal_requested_at) return "Removal pending";
  if (media.approval_status === "approved") return "Live";
  if (media.approval_status === "rejected") return "Rejected";
  return "Waiting for approval";
};

export function ServiceMediaManager({ offeringId, serviceId }: { offeringId: string; serviceId: string }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
  const inputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<ServiceMedia[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch(`${apiUrl}/api/services/vendor/offerings/${offeringId}/media`, {
      credentials: "include",
      headers: { "x-request-from": "vendor" },
    });
    if (res.ok) setMedia((await res.json()).data || []);
    else toast.error("Could not load service media");
  };

  useEffect(() => {
    void load();
  }, [offeringId]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${apiUrl}/api/services/${serviceId}/media`, {
          method: "POST",
          credentials: "include",
          headers: { "x-request-from": "vendor" },
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.message || `Could not upload ${file.name}`);
        }
      }
      await load();
    } catch {
      toast.error("Network error uploading media");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (item: ServiceMedia) => {
    if (!confirm("Remove this file? Live files stay up until the admin approves.")) return;
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/api/services/vendor/offerings/${offeringId}/media/${item.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "x-request-from": "vendor" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) toast.success(data.message || "Media removed");
      else toast.error(data.message || "Could not remove this file");
      await load();
    } catch {
      toast.error("Network error removing media");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mt-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Photos &amp; Video</h2>
      <p className="text-gray-500 mb-4">Up to 3 images and 1 video. New files and removals need admin approval.</p>
      {media.length === 0 ? (
        <p className="text-gray-500 mb-4">No media added yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {media.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {item.media_type === "video" ? (
                <video src={item.media_url} controls className="w-full h-28 object-cover bg-gray-900" />
              ) : (
                <img src={item.media_url} alt="Service" className="w-full h-28 object-cover bg-gray-100" />
              )}
              <div className="p-2 space-y-1">
                <p className="text-xs font-medium text-gray-600">{statusLabel(item)}</p>
                {!item.removal_requested_at && (
                  <button type="button" disabled={busy} onClick={() => void remove(item)} className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        aria-label="Add service photos or video"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        disabled={busy}
        onChange={(e) => void upload(e.target.files)}
        className="block text-sm text-gray-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium"
      />
    </div>
  );
}
