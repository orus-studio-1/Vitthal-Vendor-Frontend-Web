"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, Truck, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

type FleetVehicle = { id: string; vehicle_class: string; vehicle_name: string; payload: string; dimensions: string; image_url: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
const VEHICLE_CLASSES = ["3 Wheeler", "Mini Truck", "Pickup Truck", "14ft Truck", "17ft Truck", "20ft Truck", "Flatbed Truck", "Other"];

export default function LogisticsVehiclesPage() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicleClass, setVehicleClass] = useState(VEHICLE_CLASSES[0]);
  const [customClass, setCustomClass] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [payload, setPayload] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [imageKey, setImageKey] = useState("");
  const [imageName, setImageName] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadVehicles = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/vendors/logistics-vehicles`, { credentials: "include", headers: { "x-request-from": "vendor" } });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Could not load fleet.");
      setVehicles(Array.isArray(json.data) ? json.data : []);
    } catch (error: any) { toast.error(error.message || "Could not load fleet."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadVehicles(); }, [loadVehicles]);

  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { toast.error("Choose an image no larger than 5 MB."); return; }
    setUploading(true);
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch(`${API_URL}/api/upload`, { method: "POST", credentials: "include", body });
      const json = await response.json();
      if (!response.ok || !json.success || !json.fileName) throw new Error(json.message || "Image upload failed.");
      setImageKey(json.fileName); setImageName(file.name); toast.success("Vehicle image uploaded.");
    } catch (error: any) { toast.error(error.message || "Image upload failed."); }
    finally { setUploading(false); }
  };

  const addVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanClass = vehicleClass === "Other" ? customClass.trim() : vehicleClass;
    if (!cleanClass || !vehicleName.trim() || !payload.trim() || !dimensions.trim() || !imageKey) { toast.error("Complete every vehicle field and upload its image."); return; }
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/vendors/logistics-vehicles`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "x-request-from": "vendor" }, body: JSON.stringify({ vehicle_class: cleanClass, vehicle_name: vehicleName, payload, dimensions, image_key: imageKey }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Could not save vehicle.");
      setVehicles((current) => [json.data, ...current]);
      setVehicleName(""); setPayload(""); setDimensions(""); setImageKey(""); setImageName("");
      toast.success("Vehicle added to your available fleet.");
    } catch (error: any) { toast.error(error.message || "Could not save vehicle."); }
    finally { setSaving(false); }
  };

  const removeVehicle = async (vehicle: FleetVehicle) => {
    try {
      const response = await fetch(`${API_URL}/api/vendors/logistics-vehicles/${vehicle.id}`, { method: "DELETE", credentials: "include", headers: { "x-request-from": "vendor" } });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Could not remove vehicle.");
      setVehicles((current) => current.filter((item) => item.id !== vehicle.id));
      toast.success("Vehicle removed from your fleet.");
    } catch (error: any) { toast.error(error.message || "Could not remove vehicle."); }
  };

  return <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6">
    <div><div className="flex items-center gap-2"><Truck className="h-5 w-5 text-blue-700" /><h1 className="text-2xl font-bold text-zinc-900">Logistics Fleet</h1></div><p className="mt-1 text-sm text-zinc-500">Add vehicles available for client transport requests. Requests reach vendors who offer the selected vehicle class.</p></div>
    <form onSubmit={(event) => void addVehicle(event)} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:grid-cols-2">
      <label className="text-sm font-medium text-zinc-700">Vehicle class<select value={vehicleClass} onChange={(event) => setVehicleClass(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"><option value="">Choose class</option>{VEHICLE_CLASSES.map((item) => <option key={item}>{item}</option>)}</select></label>
      {vehicleClass === "Other" && <label className="text-sm font-medium text-zinc-700">Custom vehicle class<input value={customClass} onChange={(event) => setCustomClass(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" maxLength={120} /></label>}
      <label className="text-sm font-medium text-zinc-700">Vehicle name<input required value={vehicleName} onChange={(event) => setVehicleName(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" maxLength={160} placeholder="e.g. Tata 407" /></label>
      <label className="text-sm font-medium text-zinc-700">Payload<input required value={payload} onChange={(event) => setPayload(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" maxLength={120} placeholder="e.g. 2,500 kg" /></label>
      <label className="text-sm font-medium text-zinc-700">Dimensions<input required value={dimensions} onChange={(event) => setDimensions(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" maxLength={160} placeholder="Length × width × height" /></label>
      <label className="flex cursor-pointer items-center gap-2 self-end rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:border-blue-400"><Upload className="h-4 w-4" />{uploading ? "Uploading…" : imageName || "Upload vehicle image (max 5 MB)"}<input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(event) => { void uploadImage(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} /></label>
      <div className="md:col-span-2"><button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}Add vehicle</button></div>
    </form>
    <section><h2 className="mb-3 text-lg font-semibold text-zinc-900">Your available vehicles</h2>{loading ? <p className="text-sm text-zinc-500">Loading fleet…</p> : vehicles.length === 0 ? <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">No vehicles added yet.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{vehicles.map((vehicle) => <article key={vehicle.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white"><img src={vehicle.image_url} alt={vehicle.vehicle_name} className="h-44 w-full bg-zinc-50 object-contain" /><div className="space-y-1 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{vehicle.vehicle_class}</p><h3 className="font-semibold text-zinc-900">{vehicle.vehicle_name}</h3><p className="text-sm text-zinc-600">Payload: {vehicle.payload}</p><p className="text-sm text-zinc-600">Dimensions: {vehicle.dimensions}</p><button type="button" onClick={() => void removeVehicle(vehicle)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><Trash2 className="h-3.5 w-3.5" />Remove</button></div></article>)}</div>}</section>
  </div>;
}
