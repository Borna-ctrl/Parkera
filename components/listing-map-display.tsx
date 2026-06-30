"use client";

import Map, { Layer, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const MAPBOX_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL ?? "mapbox://styles/mapbox/streets-v12";

function makeCircle(lng: number, lat: number, radiusKm: number, points = 64) {
  const coords: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const dLng =
      (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(angle);
    const dLat = (radiusKm / 111.32) * Math.sin(angle);
    coords.push([lng + dLng, lat + dLat]);
  }
  coords.push(coords[0]);
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [coords] },
    properties: {},
  };
}

export function ListingMapDisplay({ lat, lng }: { lat: number; lng: number }) {
  const circle = makeCircle(lng, lat, 0.2);

  return (
    <a
      href={`https://www.google.com/maps?q=${lat},${lng}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block cursor-pointer"
      title="Öppna i Google Maps"
    >
    <div className="h-52 overflow-hidden rounded-lg border border-border">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAPBOX_STYLE}
        initialViewState={{ longitude: lng, latitude: lat, zoom: 14 }}
        scrollZoom={false}
        dragRotate={false}
        interactive={false}
      >
        <Source id="circle" type="geojson" data={circle}>
          <Layer
            id="circle-fill"
            type="fill"
            paint={{ "fill-color": "#0d9488", "fill-opacity": 0.25 }}
          />
          <Layer
            id="circle-line"
            type="line"
            paint={{ "line-color": "#0d9488", "line-width": 2 }}
          />
        </Source>
      </Map>
    </div>
    </a>
  );
}
