'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// ---- Minimal Google Maps typings to avoid `any` without adding @types/google.maps
type GMap = {
  panTo: (pos: unknown) => void;
  setZoom: (z: number) => void;
  fitBounds: (bounds: unknown) => void;
};
type GMarker = {
  setMap: (map: unknown | null | undefined) => void;
  addListener: (type: string, listener: (...args: unknown[]) => void) => void;
  getPosition: () => unknown;
};
type GInfoWindow = {
  setContent: (content: string | HTMLElement) => void;
  open: (map: unknown, anchor?: unknown) => void;
};

type GEvent = { trigger: (target: unknown, eventName: string) => void };

type GSymbolPath = { CIRCLE: number | string };
type GAnimation = { DROP: number | string; BOUNCE: number | string };

type GMapsNS = {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap;
  Marker: new (opts: Record<string, unknown>) => GMarker;
  InfoWindow: new (opts?: Record<string, unknown>) => GInfoWindow;
  LatLngBounds: new () => unknown;
  LatLng: new (lat: number, lng: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  Size: new (w: number, h: number) => unknown;
  event: GEvent;
  SymbolPath: GSymbolPath;
  Animation: GAnimation;
  MapTypeId: { ROADMAP: string; SATELLITE: string; HYBRID: string; TERRAIN: string };
  ControlPosition: { TOP_LEFT: number; TOP_RIGHT: number; BOTTOM_LEFT: number; BOTTOM_RIGHT: number };
};

declare global {
  interface Window {
    google?: { maps?: GMapsNS };
  }
}

// Load Google Maps JS API in the browser and report status
function useGoogleMaps(apiKey?: string, language?: string) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error' | 'no-key'>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR safety
    if (!apiKey) { setStatus('no-key'); return; }
    if ((window as Window).google?.maps) { setStatus('ready'); return; }

    let script = document.querySelector<HTMLScriptElement>('script[data-gmaps]');
    const onLoad = () => setStatus('ready');
    const onErr  = () => setStatus('error');

    if (!script) {
      script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${language ? `&language=${language}` : ''}`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-gmaps', '1');
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onErr, { once: true });
      document.head.appendChild(script);
      setStatus('loading');
    } else {
      setStatus((window as Window).google?.maps ? 'ready' : 'loading');
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onErr, { once: true });
    }

    return () => {
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onErr);
    };
  }, [apiKey, language]);

  return status;
}

type LatLngLiteral = { lat: number; lng: number };

export default function Page() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const status = useGoogleMaps(apiKey, 'ru');

  const mapRef = useRef<GMap | undefined>(undefined);
  const infoRef = useRef<GInfoWindow | undefined>(undefined);
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  // Example center (KZ-ish)
  const center: LatLngLiteral = { lat: 48, lng: 66 };

  useEffect(() => {
    if (status !== 'ready') return;
    const g = (window as Window).google;
    if (!g?.maps) return;
    const gm = g.maps!;

    if (!mapRef.current && mapDivRef.current) {
      mapRef.current = new gm.Map(mapDivRef.current as HTMLElement, {
        center,
        zoom: 5,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
      infoRef.current = new gm.InfoWindow();
    }

    // Example marker
    const CIRCLE = (gm.SymbolPath?.CIRCLE as number | string) ?? 0;
    const DROP   = (gm.Animation?.DROP as number | string) ?? 0;

    const marker = new gm.Marker({
      position: center,
      map: mapRef.current,
      title: 'Center',
      icon: {
        path: CIRCLE,
        scale: 10,
        fillColor: '#0ea5e9',
        fillOpacity: 0.9,
        strokeWeight: 2,
        strokeColor: '#fff',
        strokeOpacity: 1,
      },
      animation: DROP,
    });

    marker.addListener('click', () => {
      infoRef.current?.setContent('Center marker');
      infoRef.current?.open(mapRef.current, marker);
    });

    return () => {
      marker.setMap?.(null);
    };
  }, [status]);

  return (
    <main className="min-h-screen p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Alash Arulary</h1>

      {status === 'no-key' && (
        <div className="rounded-lg border p-4 text-sm">
          Добавьте переменную <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> в Vercel/локально.
        </div>
      )}
      {status === 'loading' && (
        <div className="rounded-lg border p-4 text-sm">Загружаем Google Maps…</div>
      )}
      {status === 'error' && (
        <div className="rounded-lg border p-4 text-sm text-red-600">Ошибка загрузки Google Maps</div>
      )}

      <div ref={mapDivRef} className="w-full h-[480px] rounded-xl border" />

      <div className="flex items-center gap-3">
        <Image
          src="/favicon.ico"
          alt="icon"
          width={32}
          height={32}
          priority
        />
        <span className="text-sm text-neutral-600">Next.js + Google Maps demo</span>
      </div>
    </main>
  );
}
