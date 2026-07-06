"use client";

import Link from "next/link";
import Map, { Layer, Marker, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const MAPBOX_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL ?? "mapbox://styles/mapbox/streets-v12";

function makeCircle(lng: number, lat: number, radiusKm = 0.2, points = 64) {
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

export type HomepageMapListing = {
  id: string;
  price_per_day: number;
  latitude: number;
  longitude: number;
};

export function HomepageMap({ listings }: { listings: HomepageMapListing[] }) {
  const circlesGeoJSON = {
    type: "FeatureCollection" as const,
    features: listings.map((l) => makeCircle(l.longitude, l.latitude)),
  };

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Platser nära dig</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ungefärliga lägen — exakt adress visas efter bekräftad bokning.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-primary">
          <span className="relative h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60" />
            <span className="absolute inset-0 rounded-full bg-success" />
          </span>
          Live · {listings.length} platser
        </span>
      </div>

      <div className="relative h-[330px] overflow-hidden rounded-2xl border border-border">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={MAPBOX_STYLE}
          initialViewState={{ longitude: 11.97, latitude: 57.706, zoom: 11.5 }}
          interactive={false}
          style={{ width: "100%", height: "100%" }}
        >
          <Source id="circles" type="geojson" data={circlesGeoJSON}>
            <Layer
              id="circles-fill"
              type="fill"
              paint={{ "fill-color": "#1b4965", "fill-opacity": 0.12 }}
            />
            <Layer
              id="circles-line"
              type="line"
              paint={{
                "line-color": "#1b4965",
                "line-width": 1.5,
                "line-dasharray": [2, 2],
              }}
            />
          </Source>

          {listings.map((l, i) => (
            <Marker
              key={l.id}
              longitude={l.longitude}
              latitude={l.latitude}
              anchor="center"
            >
              <Link
                href={`/listings/${l.id}`}
                className="block rounded-full px-2.5 py-1 text-sm font-bold shadow-md transition-transform hover:scale-105"
                style={
                  i === 0
                    ? { background: "#1b4965", color: "#ffffff" }
                    : { background: "#ffffff", color: "#1b4965", border: "1px solid #e4ddd0" }
                }
              >
                {l.price_per_day} kr
              </Link>
            </Marker>
          ))}
        </Map>

        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <span className="h-3 w-3 rounded-full border border-dashed border-primary bg-primary/10" />
          Cirkeln visar ungefärligt område, inte exakt plats
        </div>
      </div>
    </section>
  );
}
