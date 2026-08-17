"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Navigation, Search, Loader2, X } from "lucide-react";

interface MapStyleConfig {
  name: string;
  url: string;
  attribution: string;
  subdomains?: string | string[];
  maxZoom?: number;
}

const MAP_STYLES: Record<string, MapStyleConfig> = {
  standard: {
    name: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ["a", "b", "c"],
    maxZoom: 19,
  },
  cartoLight: {
    name: "Light",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CartoDB",
    subdomains: "abcd",
    maxZoom: 19,
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
    subdomains: ["a", "b", "c"],
    maxZoom: 19,
  },
  cartoDark: {
    name: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CartoDB",
    subdomains: "abcd",
    maxZoom: 19,
  },
};

export interface MapLocationData {
  lat: number;
  lng: number;
  displayName?: string;
  addressDetails?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface MapPickerProps {
  latitude: number | string | null | undefined;
  longitude: number | string | null | undefined;
  onChange: (lat: number, lng: number, locationData?: MapLocationData) => void;
  height?: string;
}

export default function MapPicker({
  latitude,
  longitude,
  onChange,
  height = "280px",
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>("standard");

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Load Leaflet dynamically from CDN if not yet loaded in window
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const linkId = "leaflet-css-cdn";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    const scriptId = "leaflet-js-cdn";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      script.addEventListener("load", () => setLeafletLoaded(true));
      if ((window as any).L) {
        setLeafletLoaded(true);
      }
    }
  }, []);

  const fetchAddressDetails = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        return {
          lat,
          lng,
          displayName: data.display_name,
          addressDetails: {
            road: data.address?.road || data.address?.pedestrian || data.address?.street,
            suburb: data.address?.suburb || data.address?.neighbourhood,
            city: data.address?.city || data.address?.town || data.address?.village || data.address?.county,
            state: data.address?.state,
            country: data.address?.country || "India",
            postcode: data.address?.postcode,
          },
        };
      }
    } catch {
      // non-critical
    }
    return { lat, lng };
  }, []);

  const createPinIcon = (L: any) => {
    return L.divIcon({
      className: "custom-map-pin",
      html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:#059669;color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.4);">
               <div style="width:8px;height:8px;background:#ffffff;border-radius:50%;"></div>
             </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
  };

  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const parsedLat = parseFloat(String(latitude));
    const parsedLng = parseFloat(String(longitude));
    const defaultLat = !isNaN(parsedLat) && parsedLat !== 0 ? parsedLat : 18.5204;
    const defaultLng = !isNaN(parsedLng) && parsedLng !== 0 ? parsedLng : 73.8567;

    const container = mapContainerRef.current;

    if (mapRef.current) {
      try {
        mapRef.current.off();
        mapRef.current.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
    }

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: false,
    }).setView([defaultLat, defaultLng], 14);

    const style = MAP_STYLES[mapStyle] || MAP_STYLES.standard;
    tileLayerRef.current = L.tileLayer(style.url, {
      maxZoom: style.maxZoom || 19,
      subdomains: style.subdomains || "abc",
      attribution: style.attribution,
    }).addTo(map);

    const customIcon = createPinIcon(L);

    const marker = L.marker([defaultLat, defaultLng], {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    marker.on("dragend", async () => {
      if (!mapRef.current || !(mapRef.current as any)._mapPane) return;
      const position = marker.getLatLng();
      const lat = Number(position.lat.toFixed(6));
      const lng = Number(position.lng.toFixed(6));
      const locationData = await fetchAddressDetails(lat, lng);
      onChangeRef.current(lat, lng, locationData);
    });

    map.on("click", async (e: any) => {
      if (!mapRef.current || !(mapRef.current as any)._mapPane) return;
      const { lat, lng } = e.latlng;
      const roundedLat = Number(lat.toFixed(6));
      const roundedLng = Number(lng.toFixed(6));
      marker.setLatLng([roundedLat, roundedLng]);
      const locationData = await fetchAddressDetails(roundedLat, roundedLng);
      onChangeRef.current(roundedLat, roundedLng, locationData);
    });

    mapRef.current = map;
    markerRef.current = marker;

    const invalidate = () => {
      if (mapRef.current && (mapRef.current as any)._mapPane) {
        try {
          mapRef.current.invalidateSize({ animate: false });
        } catch {
          // ignore
        }
      }
    };

    invalidate();
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 300);
    const t3 = setTimeout(invalidate, 700);
    const t4 = setTimeout(invalidate, 1200);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && container) {
      resizeObserver = new ResizeObserver(() => {
        invalidate();
      });
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapRef.current) {
        try {
          mapRef.current.off();
          mapRef.current.remove();
        } catch {
          // ignore
        }
        mapRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [leafletLoaded, fetchAddressDetails]);

  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const style = MAP_STYLES[mapStyle] || MAP_STYLES.standard;
    tileLayerRef.current = L.tileLayer(style.url, {
      maxZoom: style.maxZoom || 19,
      subdomains: style.subdomains || "abc",
      attribution: style.attribution,
    }).addTo(mapRef.current);
  }, [mapStyle, leafletLoaded]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !(mapRef.current as any)._mapPane) return;

    const currentLat = parseFloat(String(latitude));
    const currentLng = parseFloat(String(longitude));

    if (!isNaN(currentLat) && !isNaN(currentLng) && currentLat !== 0 && currentLng !== 0) {
      const markerLatLng = markerRef.current.getLatLng();
      const diffLat = Math.abs(markerLatLng.lat - currentLat);
      const diffLng = Math.abs(markerLatLng.lng - currentLng);

      if (diffLat > 0.0001 || diffLng > 0.0001) {
        markerRef.current.setLatLng([currentLat, currentLng]);
        mapRef.current.setView([currentLat, currentLng], mapRef.current.getZoom() || 14, { animate: false });
      }
    }
  }, [latitude, longitude]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setGeolocating(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        if (mapRef.current && markerRef.current && (mapRef.current as any)._mapPane) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.setView([lat, lng], 15);
          mapRef.current.invalidateSize();
        }

        const locationData = await fetchAddressDetails(lat, lng);
        onChangeRef.current(lat, lng, locationData);
        setGeolocating(false);
      },
      (error) => {
        console.error("Error fetching geolocation:", error);
        setErrorMsg("Unable to retrieve location. Please allow GPS permission in your browser.");
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=5&countrycodes=in`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
        }
      } catch {
        // ignore
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = async (item: any) => {
    const lat = Number(parseFloat(item.lat).toFixed(6));
    const lng = Number(parseFloat(item.lon).toFixed(6));

    setSearchQuery(item.display_name);
    setShowSuggestions(false);

    if (mapRef.current && markerRef.current && (mapRef.current as any)._mapPane) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], 15);
      mapRef.current.invalidateSize();
    }

    const locationData = await fetchAddressDetails(lat, lng);
    onChangeRef.current(lat, lng, {
      ...locationData,
      displayName: item.display_name,
    });
  };

  const handleLocationSearch = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setErrorMsg("");
    setShowSuggestions(false);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1&countrycodes=in`
      );
      const results = await response.json();

      if (results && results.length > 0) {
        const lat = Number(parseFloat(results[0].lat).toFixed(6));
        const lng = Number(parseFloat(results[0].lon).toFixed(6));

        if (mapRef.current && markerRef.current && (mapRef.current as any)._mapPane) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.setView([lat, lng], 15);
          mapRef.current.invalidateSize();
        }

        const locationData = await fetchAddressDetails(lat, lng);
        onChangeRef.current(lat, lng, {
          ...locationData,
          displayName: results[0].display_name,
        });
      } else {
        setErrorMsg("Location not found. Try searching for your city, locality, or pin code.");
      }
    } catch (err) {
      console.error("Error searching location:", err);
      setErrorMsg("Location search service unavailable. You can click on the map directly.");
    } finally {
      setSearching(false);
    }
  };

  const hasCoords = Boolean(
    latitude !== null &&
      latitude !== undefined &&
      longitude !== null &&
      longitude !== undefined &&
      Number(latitude) !== 0 &&
      Number(longitude) !== 0
  );

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center relative z-20">
        <div ref={searchContainerRef} className="relative flex flex-1">
          <input
            type="text"
            placeholder="Search warehouse/office address or landmark..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleLocationSearch(e);
              }
            }}
            className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-24 py-2.5 text-xs placeholder-zinc-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition shadow-xs"
          />
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-zinc-400" />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
              }}
              className="absolute right-20 top-2.5 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleLocationSearch()}
            disabled={searching}
            className="absolute right-1.5 top-1.5 flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
          >
            {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : "Search"}
          </button>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl transition-all">
              {suggestions.map((item) => (
                <button
                  key={item.place_id}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left rounded-lg px-3 py-2 text-[11px] text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900 transition flex items-start gap-2 border-none cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="truncate">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geolocating}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition whitespace-nowrap cursor-pointer"
        >
          {geolocating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Navigation className="h-3.5 w-3.5 rotate-45 fill-emerald-600" />
          )}
          Use Current GPS
        </button>
      </div>

      {errorMsg && <p className="text-[11px] font-medium text-red-600">{errorMsg}</p>}

      <div className="relative rounded-2xl border border-zinc-200 bg-zinc-100 overflow-hidden shadow-inner z-10">
        {!leafletLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-zinc-50/90 backdrop-blur-xs">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-xs text-zinc-500 font-medium">Loading interactive OpenStreetMap...</p>
          </div>
        )}

        {leafletLoaded && (
          <div className="absolute left-2.5 top-2.5 z-10 flex gap-1 rounded-xl bg-white/95 p-1 shadow-md backdrop-blur-xs border border-zinc-200/80">
            {(Object.keys(MAP_STYLES) as Array<keyof typeof MAP_STYLES>).map((styleKey) => (
              <button
                key={styleKey}
                type="button"
                onClick={() => setMapStyle(styleKey)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition cursor-pointer ${
                  mapStyle === styleKey
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {MAP_STYLES[styleKey].name}
              </button>
            ))}
          </div>
        )}

        <div
          ref={mapContainerRef}
          style={{ height, width: "100%", position: "relative", minHeight: "240px" }}
          className="z-0"
        />

        <div className="absolute bottom-2.5 right-2.5 z-10 rounded-lg bg-white/95 px-2.5 py-1 shadow-md text-[10px] font-semibold text-zinc-600 pointer-events-none flex items-center gap-1.5 border border-zinc-200/80">
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          {hasCoords ? (
            <span>
              {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
            </span>
          ) : (
            <span>Click or drag pin to choose location</span>
          )}
        </div>
      </div>
    </div>
  );
}
