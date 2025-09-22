'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

/**
 * Replace this with your real data. The important piece is that `position`
 * is a google.maps.LatLngLiteral (or LatLng).
 */
type Point = {
  id: string;
  title?: string;
  position: google.maps.LatLngLiteral;
};

export default function Page() {
  // Provide your own points array (from state, props, fetch, etc.)
  const points: Point[] = useMemo(
    () => [
      { id: '1', title: 'A', position: { lat: 43.238949, lng: 76.889709 } },
      { id: '2', title: 'B', position: { lat: 43.25654, lng: 76.92848 } },
      { id: '3', title: 'C', position: { lat: 43.222, lng: 76.851 } },
    ],
    []
  );

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Keep markers and one InfoWindow instance around
  const markersRef = useRef<Record<string, google.maps.Marker>>({});
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Load Google Maps JS API on the client only
  useEffect(() => {
    let canceled = false;

    (async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error(
            'Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Set it in .env.local and Vercel Project Settings → Environment Variables.'
          );
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['marker', 'places'],
        });

        // Load the API
        await loader.load();

        if (!canceled) setMapsReady(true);
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : typeof e === 'string' ? e : 'Failed to load Google Maps API';
        if (!canceled) setError(message);
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  // Initialize map when mapsReady
  useEffect(() => {
    if (!mapsReady) return;
    if (!mapDivRef.current) return;

    // Initialize the map once
    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(mapDivRef.current, {
        center: { lat: 43.238949, lng: 76.889709 },
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
      });
    }

    const map = mapRef.current!;
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    boundsRef.current = new google.maps.LatLngBounds();
    const bounds = boundsRef.current;

    // Clear existing markers if any
    for (const id in markersRef.current) {
      markersRef.current[id].setMap(null);
    }
    markersRef.current = {};

    // Create markers and extend bounds
    points.forEach((p) => {
      const marker = new google.maps.Marker({
        position: p.position,
        map,
        title: p.title ?? '',
      });

      markersRef.current[p.id] = marker;

      const pos = marker.getPosition();
      if (pos) bounds.extend(pos);

      marker.addListener('click', () => {
        const html = `
          <div style="min-width:180px">
            <strong>${p.title ?? 'Point ' + p.id}</strong><br/>
            <button id="ih-open-bio-${p.id}" type="button">Open</button>
          </div>
        `;
        infoWindowRef.current!.setContent(html);
        infoWindowRef.current!.open({
          anchor: marker,
          map,
        });

        google.maps.event.addListenerOnce(infoWindowRef.current!, 'domready', () => {
          const btn = document.getElementById(`ih-open-bio-${p.id}`);
          if (btn) {
            btn.addEventListener('click', () => {
              console.log('Open clicked for', p.id);
            });
          }
        });
      });
    });

    // Fit to bounds if we have any points
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    } else {
      map.setCenter({ lat: 43.238949, lng: 76.889709 });
      map.setZoom(11);
    }
  }, [mapsReady, points]);

  return (
    <main className="w-full h-dvh">
      {!mapsReady && !error && (
        <div className="w-full h-full grid place-items-center text-sm opacity-70">
          Loading map…
        </div>
      )}
      {error && (
        <div className="w-full h-full grid place-items-center text-red-600">
          {error}
        </div>
      )}
      <div
        ref={mapDivRef}
        style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}
      />
    </main>
  );
}
