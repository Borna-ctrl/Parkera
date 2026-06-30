"use client";

import { useRef, useState, useCallback } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import { Button } from "@/components/ui/button";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const MAPBOX_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL ?? "mapbox://styles/mapbox/streets-v12";

const DEFAULT_LNG = 11.967;
const DEFAULT_LAT = 57.707;

type Coords = { lat: number; lng: number };

export function ListingMapEditor({
  initialLat,
  initialLng,
  address,
  onChange,
}: {
  initialLat?: number;
  initialLng?: number;
  address?: string;
  onChange: (lat: number, lng: number) => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const [marker, setMarker] = useState<Coords | undefined>(
    initialLat != null && initialLng != null
      ? { lat: initialLat, lng: initialLng }
      : undefined
  );
  const [geocoding, setGeocoding] = useState(false);

  const updateMarker = useCallback(
    (coords: Coords) => {
      setMarker(coords);
      onChange(coords.lat, coords.lng);
    },
    [onChange]
  );

  async function geocodeAddress() {
    if (!address?.trim()) return;
    setGeocoding(true);
    try {
      const query = encodeURIComponent(address.trim());
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&country=se&language=sv&limit=1`;
      const res = await fetch(url);
      const json = await res.json();
      const feature = json.features?.[0];
      if (!feature) return;
      const [lng, lat] = feature.center as [number, number];
      updateMarker({ lat, lng });
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
    } finally {
      setGeocoding(false);
    }
  }

  function handleMapClick(e: { lngLat: { lat: number; lng: number } }) {
    updateMarker({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Klicka på kartan eller dra markören för att sätta platsen
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={geocodeAddress}
          disabled={geocoding || !address?.trim()}
        >
          {geocoding ? "Söker…" : "Hitta på karta"}
        </Button>
      </div>

      <div className="h-56 overflow-hidden rounded-md border border-border">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={MAPBOX_STYLE}
          initialViewState={{
            longitude: initialLng ?? DEFAULT_LNG,
            latitude: initialLat ?? DEFAULT_LAT,
            zoom: initialLat != null ? 15 : 11,
          }}
          onClick={handleMapClick}
          cursor="crosshair"
        >
          <NavigationControl position="top-right" showCompass={false} />
          {marker && (
            <Marker
              longitude={marker.lng}
              latitude={marker.lat}
              draggable
              onDragEnd={(e) =>
                updateMarker({ lat: e.lngLat.lat, lng: e.lngLat.lng })
              }
              color="#0d9488"
            />
          )}
        </Map>
      </div>

      {marker && (
        <p className="text-xs text-muted-foreground">
          {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
        </p>
      )}

      <input type="hidden" name="latitude" value={marker?.lat ?? ""} />
      <input type="hidden" name="longitude" value={marker?.lng ?? ""} />
    </div>
  );
}
