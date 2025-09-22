"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Maximize2, Sparkles, Quote, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// ---- Minimal Google Maps typings to avoid `any` without adding @types/google.maps
type GMap = {
  panTo: (pos: unknown) => void;
  setZoom: (z: number) => void;
  fitBounds: (bounds: unknown) => void;
};
type GMarker = {
  setMap: (map: unknown | null) => void;
  addListener: (type: string, listener: (...args: unknown[]) => void) => void;
  getPosition: () => unknown;
};
type GInfoWindow = {
  setContent: (content: string | HTMLElement) => void;
  open: (map: unknown, anchor?: unknown) => void;
};
type GEvent = { trigger: (target: unknown, eventName: string) => void };
type GMapsNS = {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap;
  Marker: new (opts: Record<string, unknown>) => GMarker;
  InfoWindow: new (opts?: Record<string, unknown>) => GInfoWindow;
  LatLngBounds: new () => unknown;
  event: GEvent;
};
declare global {
  interface Window {
    google?: { maps?: GMapsNS };
  }
}


// ------------------------------------------------------------------
// GOOGLE MAPS API KEY HANDLING
// ------------------------------------------------------------------
const DEFAULT_PRESET_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
function getMapsKey(): string | undefined {
  return DEFAULT_PRESET_KEY;
}

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface Person {
  id: string;
  name: string;           // Kazakh display (default)
  photo: string;
  birthYear: number;
  deathYear: number | null;
  fields: string[];       // KK
  bio: string;            // KK
  works?: number;
  education?: string;
  // English overrides used when lang==='en'
  name_en?: string;
  fields_en?: string[];
  bio_en?: string;
  education_en?: string;
  // Map info
  lat?: number;
  lng?: number;
  city?: string;
}

interface QuoteItem { text: string; author: string; }

type Lang = keyof typeof I18N;

type Route = "map" | "dashboard" | "quotes";

// ------------------------------------------------------------------
// I18N
// ------------------------------------------------------------------
const I18N = {
  en: {
    title: "Alash Arulary",
    roleModels: "Role models for teens & early youth",
    inspirationalMap: "Inspirational Map",
    expand: "Expand",
    exploreWorld: "Explore the World of Trailblazers",
    dashboardTitle: "Dashboard — Main Information",
    searchPlaceholder: "Search by name or field",
    lifespan: "Lifespan",
    fields: "Fields",
    works: "Works",
    readBio: "Read Biography",
    education: "Education",
    quoteOfDay: "Quote of the Day",
    quotesRotate: "Quotes rotate every 20 seconds.",
    newRandomQuote: "New Random Quote",
    footer: "Built with ❤️",
    langLabel: "Language",
    navMap: "Map",
    navDashboard: "Dashboard",
    navQuotes: "Quotes",
    mapMissingKey: "Google Maps not available (API key missing or blocked). Showing fallback.",
    places: "Places",
    open: "Open",
  },
  kk: {
    title: "Алаш Арулары",
    roleModels: "Жасөспірімдерге үлгі болатын тұлғалар",
    inspirationalMap: "Шабыт картасы",
    expand: "Үлкейту",
    exploreWorld: "Таңдаулы тұлғалар әлемін зерттеңіз",
    dashboardTitle: "Дашборд — Негізгі ақпарат",
    searchPlaceholder: "Аты немесе сала бойынша іздеу",
    lifespan: "Өмір жасы",
    fields: "Салалар",
    works: "Еңбектер",
    readBio: "Өмірбаянын оқу",
    education: "Білімі",
    quoteOfDay: "Күннің дәйексөзі",
    quotesRotate: "Дәйексөздер әр 20 секунд сайын ауысады.",
    newRandomQuote: "Кездейсоқ дәйексөз",
    footer: "Махаббатпен жасалған ❤️",
    langLabel: "Тіл",
    navMap: "Карта",
    navDashboard: "Дашборд",
    navQuotes: "Дәйексөздер",
    mapMissingKey: "Google Maps қолжетімсіз (API кілті жоқ не бұғатталған). Уақытша ендірілген карта көрсетіледі.",
    places: "Орындар",
    open: "Ашу",
  },
};

// ------------------------------------------------------------------
// Data (with city/raion geolocations)
// ------------------------------------------------------------------
const peopleData: Person[] = [
  {
    id: "husnizhamal-nuralykhanova",
    name: "Хұснижамал Нұралыханова",
    name_en: "Khusnizhamal Nuralykhanova",
    photo: "https://cdn.jsdelivr.net/gh/Bixen7135/alash-arulary@main/assets/images/husnizhamal-nuralykhanova.png",
    birthYear: 1872,
    deathYear: 1945,
    fields: ["Білім", "Саясат"],
    fields_en: ["Education", "Politics"],
    education: "Қазанның Земская мектебі, Орынбордың Нюплеев корпусы",
    education_en: "Kazan Zemstvo School, Orenburg Nyupleev Corps",
    bio: "Тұңғыш мектеп ашқан қазақ қызы",
    bio_en: "The first Kazakh girl to open a school.",
    city: "Бөкей Ордасы (Батыс Қазақстан)",
    lat: 47.12,
    lng: 51.85,
  },
  {
    id: "gainizhamal-dosymbekova",
    name: "Ғайнижамал Досымбекова",
    name_en: "Gainizhamal Dosymbekova",
    photo: "https://cdn.jsdelivr.net/gh/Bixen7135/alash-arulary@main/assets/images/gainizhamal-dosymbekova.png",
    birthYear: 1895,
    deathYear: 1940,
    fields: ["Журналистика", "Саясат"],
    fields_en: ["Journalism", "Politics"],
    education: "Орынбор гимназиясы",
    education_en: "Orenburg Gymnasium",
    bio: "қазақтың тұңғыш тілші қызы",
    bio_en: "The first female Kazakh reporter.",
    city: "Қызылжар (Петропавл)",
    lat: 54.873,
    lng: 69.162,
  },
  {
    id: "nazipa-qulzhanova",
    name: "Нәзипа Құлжанова",
    name_en: "Nazipa Qulzhanova",
    photo: "https://cdn.jsdelivr.net/gh/Bixen7135/alash-arulary@main/assets/images/nazipa-qulzhanova.png",
    birthYear: 1887,
    deathYear: 1934,
    fields: ["Журналистика", "Саясат", "Білім"],
    fields_en: ["Journalism", "Politics", "Education"],
    education: "Қостанайдағы орыс-қазақ гимназиясы, Торғайдағы қыздар училищесі",
    education_en: "Kostanay Russian-Kazakh Gymnasium; Torgai Girls' School",
    bio: "тұңғыш аудармашы және журналист қазақ қызы",
    bio_en: "Pioneer translator and journalist from Kazakhstan.",
    city: "Торғай",
    lat: 49.626,
    lng: 63.498,
  },
  {
    id: "aqqagaz-doszhanova",
    name: "Аққағаз Досжанова",
    name_en: "Aqqagaz Doszhanova",
    photo: "https://cdn.jsdelivr.net/gh/Bixen7135/alash-arulary@main/assets/images/aqqagaz-doszhanova.png",
    birthYear: 1893,
    deathYear: 1932,
    fields: ["Медицина", "Саясат", "Білім"],
    fields_en: ["Medicine", "Politics", "Education"],
    education: "Орынбордағы әйелдер гимназиясы, Мәскеудегі медицина курстары",
    education_en: "Orenburg Women's Gymnasium; Medical courses in Moscow",
    bio: "қазақтың дәрігер қызы",
    bio_en: "A trailblazing Kazakh female physician.",
    city: "Бөрте болысы (Ақтөбе уезі)",
    lat: 50.2839,
    lng: 57.1669,
  },
  {
    id: "gulsim-asfendiyarova",
    name: "Гүлсім Асфендиярова",
    name_en: "Gulsim Asfendiyarova",
    photo: "https://cdn.jsdelivr.net/gh/Bixen7135/alash-arulary@main/assets/images/gulsim-asfendiyarova.png",
    birthYear: 1880,
    deathYear: 1941,
    fields: ["Медицина", "Білім"],
    fields_en: ["Medicine", "Education"],
    education: "Ташкент қаласындағы әйелдер гимназиясы, Санкт-Петербург әйелдер медицина институты",
    education_en: "Tashkent Women's Gymnasium; St. Petersburg Women's Medical Institute",
    bio: "қазақтан шыққан тұңғыш дәрігер қыз",
    bio_en: "The first Kazakh female doctor.",
    city: "Шымкент",
    lat: 42.341,
    lng: 69.590,
  },
  {
    id: "shahzada-aronqyzy",
    name: "Шахзада Аронқызы",
    name_en: "Shakhzada Aronkizy",
    photo: "https://cdn.jsdelivr.net/gh/Bixen7135/alash-arulary@main/assets/images/shahzada-aronqyzy.png",
    birthYear: 1903,
    deathYear: 1938,
    fields: ["Саясат", "Білім"],
    fields_en: ["Politics", "Education"],
    education: "Орта Азия мемлекеттік университетінің Ташкент медикалық факультеті, Алматы медикалық институты",
    education_en: "Central Asian State University (Tashkent Medical Faculty); Almaty Medical Institute",
    bio: "қазақтан шыққан тұңғыш заңгер қыз",
    bio_en: "The first female lawyer from Kazakhstan.",
    city: "Жымпиты (Сырым ауданы, БҚО)",
    lat: 50.249,
    lng: 53.936,
  },
  {
    id: "patshayym-tazhibayeva",
    name: "Патшайым Тәжібаева",
    name_en: "Patshayym Tazhibayeva",
    photo: "https://cdn.jsdelivr.net/gh/Bixen7135/alash-arulary@main/assets/images/patshayym-tazhibayeva.png",
    birthYear: 1920,
    deathYear: 1991,
    fields: ["Геология", "Минералогия", "Саясат"],
    fields_en: ["Geology", "Mineralogy", "Politics"],
    education: "Алматыдағы педагогикалық училище, Ташкенттегі Орта Азия мемлекеттік университетінің геология-минерология факультеті, Қазақтың Ғылым Академиясы, Куйбышев (Самара) университетінің физика-математика факультеті",
    education_en: "Almaty Pedagogical College; Central Asian State University (Geology-Mineralogy); Kazakhstan Academy of Sciences; Kuibyshev (Samara) University (Physics-Math)",
    bio: "қазақтан шыққан тұңғыш профессор қыз",
    bio_en: "The first female professor from Kazakhstan.",
    city: "Төлеби ауданы (Түркістан обл.)",
    lat: 42.187,
    lng: 69.883,
  },
  {
    id: "nagima-aryqova",
    name: "Нағима Арықова",
    name_en: "Nagima Aryqova",
    photo: "https://cdn.jsdelivr.net/gh/Bixen7135/alash-arulary@main/assets/images/nagima-aryqova.png",
    birthYear: 1902,
    deathYear: 1956,
    fields: ["Білім", "Журналистика", "Саясат"],
    fields_en: ["Education", "Journalism", "Politics"],
    education: "Исхақия мектебі, қосымша мұғалімдер курсы, Семей губерниясының кеңестік партия мектебі",
    education_en: "Ishaqia School; Teacher's Extension Courses; Semey Provincial Party School",
    bio: "қыздар мектебінің тұңғыш директоры",
    bio_en: "The first principal of a girls' school.",
    city: "Верный (Алматы)",
    lat: 43.238,
    lng: 76.945,
  },
  {
    id: "balzhan-boltirikova",
    name: "Балжан Бөлтірікова",
    name_en: "Balzhan Boltirikova",
    photo: "https://cdn.jsdelivr.net/gh/Bixen7135/alash-arulary@main/assets/images/balzhan-boltirikova.png",
    birthYear: 1921,
    deathYear: 1998,
    fields: ["Білім", "Саясат"],
    fields_en: ["Education", "Politics"],
    education: "Алматы мұғалімдер институты, Қазақ педагогикалық институты",
    education_en: "Almaty Teachers' Institute; Kazakh Pedagogical Institute",
    bio: "БҰҰ-да сөз сөйлеген тұңғыш қазақ қызы",
    bio_en: "First Kazakh woman to address the UN.",
    city: "Қасық ауылы (Қордай ауд., Жамбыл обл.)",
    lat: 43.1,
    lng: 75.3,
  },
  {
    id: "sara-yesova",
    name: "Сара Есова",
    name_en: "Sara Yesova",
    photo: "https://cdn.jsdelivr.net/gh/Bixen7135/alash-arulary@main/assets/images/sara-yesova.png",
    birthYear: 1903,
    deathYear: 1984,
    fields: ["Білім", "Саясат", "Журналистика"],
    fields_en: ["Education", "Politics", "Journalism"],
    education: "Орынбордағы педагогикалық училище, Алматыдағы марксизм-ленинизм институтының тарих бөлімі",
    education_en: "Orenburg Pedagogical College; Institute of Marxism-Leninism (History), Almaty",
    bio: "«Тілші» газетінің редакторы",
    bio_en: "Editor of the 'Tilshi' newspaper.",
    city: "Қарашеңгел ауылы (Сырдария ауд., Қызылорда обл.)",
    lat: 45.05,
    lng: 64.98,
  },
];

// ------------------------------------------------------------------
// Quotes (EN/KK)
// ------------------------------------------------------------------
const quotesEN: QuoteItem[] = [
  { text: "I am not afraid... I was born to do this.", author: "Joan of Arc" },
  { text: "Nothing is impossible. The word itself says 'I'm possible!'", author: "Audrey Hepburn" },
  { text: "We realize the importance of our voices only when we are silenced.", author: "Malala Yousafzai" },
  { text: "The most effective way to do it, is to do it.", author: "Amelia Earhart" },
  { text: "Life shrinks or expands in proportion to one's courage.", author: "Anaïs Nin" },
];

const quotesKK: QuoteItem[] = [
  { text: "Еңбек қылмай ер оңбас.", author: "Абай Құнанбайұлы" },
  { text: "Білім — болашақтың кілті.", author: "Мақал" },
  { text: "Өзгеріс өзіңнен басталады.", author: "Нақыл сөз" },
  { text: "Үлкен арман — үлкен еңбек.", author: "Нақыл сөз" },
  { text: "Білімдіге дүние жарық.", author: "Мақал" },
];

const QUOTES_BY_LANG: Record<Lang, QuoteItem[]> = { en: quotesEN, kk: quotesKK };

// ------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------
function lifespan(birthYear: number, deathYear: number | null, lang: Lang = "kk") {
  const end = deathYear ?? new Date().getFullYear();
  const years = end - birthYear;
  const suffix = lang === "en" ? "years" : "жыл";
  return `${years} ${suffix}`;
}

function pick<T>(kk: T | undefined, en: T | undefined, lang: Lang): T | undefined {
  return lang === "en" ? (en ?? kk) : kk;
}

function assignMarkerColor(fields: string[]): string {
  if (fields.includes("Медицина") || fields.includes("Medicine")) return "#dc2626"; // vibrant red
  if (fields.includes("Білім") || fields.includes("Education")) return "#16a34a"; // vibrant green
  if (fields.includes("Саясат") || fields.includes("Politics")) return "#2563eb"; // vibrant blue
  if (fields.includes("Журналистика") || fields.includes("Journalism")) return "#d97706"; // vibrant orange
  if (fields.includes("Геология") || fields.includes("Geology")) return "#7c3aed"; // vibrant purple
  return "#4b5563"; // darker gray
}

// Script loader with graceful fallback (no build-time breakage)
function useGoogleMaps(apiKey?: string, language?: string) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error" | "no-key">("idle");
  useEffect(() => {
    if (typeof window === "undefined") return; // SSR safety
    if (!apiKey) { setStatus("no-key"); return; }
    if ((window as Window).google?.maps) { setStatus("ready"); return; }

    let script = document.querySelector<HTMLScriptElement>("script[data-gmaps]");
    const onLoad = () => setStatus("ready");
    const onErr  = () => setStatus("error");

    if (!script) {
      script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${language ? `&language=${language}` : ""}`;
      script.async = true; script.defer = true; script.setAttribute("data-gmaps", "1");
      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onErr, { once: true });
      document.head.appendChild(script);
      setStatus("loading");
    } else {
      if ((window as Window).google?.maps) setStatus("ready");
      else { setStatus("loading"); script.addEventListener("load", onLoad, { once: true }); script.addEventListener("error", onErr, { once: true }); }
    }
    return () => {
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onErr);
    };
  }, [apiKey, language]);
  return status;
}

// ------------------------------------------------------------------
// Map component (markers + places list + search + info window -> open bio)
// ------------------------------------------------------------------
function MapWithPlaces({ people, lang, onSelectPerson }: { people: Person[]; lang: Lang; onSelectPerson: (p: Person) => void; }) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const [placeQuery, setPlaceQuery] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);

  const apiKey = getMapsKey();
  const status = useGoogleMaps(apiKey, lang === "kk" ? "kk" : "en");

  const places = useMemo(() => people.filter(p => typeof p.lat === "number" && typeof p.lng === "number"), [people]);
  const placesFiltered = useMemo(() => {
    const q = placeQuery.trim().toLowerCase();
    if (!q) return places;
    return places.filter(p => {
      const nameAll = [p.name, p.name_en].filter(Boolean).join(" ").toLowerCase();
      const city = (p.city || "").toLowerCase();
      const fieldsAll = [...(p.fields || []), ...(p.fields_en || [])].join(" ").toLowerCase();
      return nameAll.includes(q) || city.includes(q) || fieldsAll.includes(q);
    });
  }, [placeQuery, places]);

  // Keep references to the map and markers
  const mapRef = useRef<GMap | null>(null);
  const infoRef = useRef<GMap | null>(null);
  const markersRef = useRef<Record<string, GMarker>>({});

  useEffect(() => {
    if (status !== "ready" || !mapDivRef.current) return;
    const google = (window as Window).google;
    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(mapDivRef.current, {
        center: { lat: 48, lng: 66 },
        zoom: 5,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
      infoRef.current = new google.maps.InfoWindow();
    }

    // clear and rebuild markers for filtered list
    Object.values(markersRef.current).forEach((m) => m.setMap(null));
    markersRef.current = {};
    const bounds = new google.maps.LatLngBounds();

    placesFiltered.forEach(p => {
      const marker = new google.maps.Marker({
        position: { lat: p.lat as number, lng: p.lng as number },
        map: mapRef.current,
        title: p.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: assignMarkerColor(p.fields),
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          strokeOpacity: 1,
        },
        animation: google.maps.Animation.DROP,
      });
      markersRef.current[p.id] = marker;
      bounds.extend(marker.getPosition());
      marker.addListener("click", () => {
        const btnId = `ih-open-bio-${p.id}`;
        const html = `
          <div style="min-width:280px; max-width:320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="padding: 16px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); border: 1px solid rgba(139, 92, 246, 0.2);">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${assignMarkerColor(p.fields)}; margin-right: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1e293b; line-height: 1.3;">${p.name}</h3>
              </div>
              ${p.city ? `<div style="margin-bottom: 8px; font-size: 13px; color: #64748b; display: flex; align-items: center;">
                <span style="margin-right: 6px;">📍</span>${p.city}
              </div>` : ""}
              <div style="margin-bottom: 12px; font-size: 13px; color: #475569; font-style: italic;">
                ${(p.fields || []).join(", ")}
              </div>
              <button id="${btnId}" style="
                width: 100%; 
                padding: 10px 16px; 
                border-radius: 8px; 
                border: none; 
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
                color: white; 
                font-size: 14px; 
                font-weight: 500; 
                cursor: pointer; 
                transition: all 0.2s ease; 
                box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
              " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(139, 92, 246, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(139, 92, 246, 0.3)'">
                ${lang === "kk" ? "📖 Өмірбаянды ашу" : "📖 Open Biography"}
              </button>
            </div>
          </div>`;
        infoRef.current.setContent(html);
        infoRef.current.open({ anchor: marker, map: mapRef.current });
        setTimeout(() => {
          const btn = document.getElementById(btnId);
          if (btn) btn.onclick = () => onSelectPerson(p);
        }, 0);
      });
    });

    if (placesFiltered.length > 1) mapRef.current.fitBounds(bounds);
    else if (placesFiltered.length === 1) mapRef.current.setCenter(bounds.getCenter());
  }, [status, placesFiltered, lang, onSelectPerson]);

  // Focus a specific marker from the list
  useEffect(() => {
    if (!focusId || !markersRef.current || !(window as Window).google?.maps) return;
    const m = markersRef.current[focusId];
    if (m) {
      (window as Window).google.maps.event.trigger(m, "click");
      mapRef.current?.panTo(m.getPosition());
      mapRef.current?.setZoom(7);
    }
  }, [focusId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 h-full">
      <div ref={mapDivRef} className="rounded-xl border shadow-sm bg-white h-[50vh] sm:h-[55vh] lg:h-[60vh]" style={{ width: "100%", minHeight: 300, maxHeight: "70vh" }} />
      <div className="h-[40vh] sm:h-[45vh] lg:h-[60vh] overflow-auto border rounded-xl p-4 bg-white/80 backdrop-blur-sm shadow-sm" style={{ maxHeight: "70vh" }}>
        <div className="mb-3 text-sm font-semibold text-purple-800 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {I18N[lang].places}
        </div>
        <Input
          placeholder={lang === 'kk' ? 'Қала/аты бойынша іздеу' : 'Search city/name'}
          value={placeQuery}
          onChange={(e) => setPlaceQuery(e.target.value)}
          className="mb-4 rounded-lg border-purple-200 focus:border-purple-400"
        />
        <div className="text-xs text-slate-500 mb-3">
          {placesFiltered.length} {lang === 'kk' ? 'орын табылды' : 'places found'}
        </div>
        <ul className="space-y-3">
          {placesFiltered.map(p => (
            <li key={p.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-amber-50 hover:from-purple-100 hover:to-amber-100 transition-all duration-200">
              <button className="text-left hover:underline flex-grow" onClick={() => setFocusId(p.id)}>
                <div className="font-medium text-slate-800">{lang === 'kk' ? p.name : (p.name_en || p.name)}</div>
                <div className="text-xs text-slate-600 mt-1">{p.city}</div>
                <div className="text-xs text-purple-600 mt-1">
                  {(lang === 'kk' ? p.fields : (p.fields_en || p.fields)).join(", ")}
                </div>
              </button>
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-lg border-purple-200 text-purple-700 hover:bg-purple-100 flex-shrink-0" 
                onClick={() => onSelectPerson(p)}
              >
                {I18N[lang].open}
              </Button>
            </li>
          ))}
        </ul>
        {(status === 'no-key' || status === 'error') && (
          <div className="mt-4 p-3 text-xs text-slate-500 bg-amber-50 rounded-lg border border-amber-200">
            {I18N[lang].mapMissingKey}
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Main App
// ------------------------------------------------------------------
export default function AlashArularyApp() {
  const [lang, setLang] = useState<Lang>("kk");
  const [route, setRoute] = useState<Route>("dashboard");
  const [query, setQuery] = useState("");
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);

  const t = (k: keyof typeof I18N["en"]) => I18N[lang][k];
  const quotes = QUOTES_BY_LANG[lang];

  // Search across both languages
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return peopleData;
    return peopleData.filter((p) => {
      const nameAll = [p.name, p.name_en].filter(Boolean).join(" ").toLowerCase();
      const fieldsAll = [...(p.fields || []), ...(p.fields_en || [])].join(" ").toLowerCase();
      return nameAll.includes(q) || fieldsAll.includes(q);
    });
  }, [query]);

  // Auto-rotate quotes every 20s
  useEffect(() => {
    const tm = setInterval(() => setQuoteIndex((prev) => (prev + 1) % quotes.length), 20000);
    return () => clearInterval(tm);
  }, [quotes.length]);

  const currentQuote = quotes[quoteIndex];

  // ----------------------------------------------------------------
  // DEV TESTS (non-blocking, console-only)
  // ----------------------------------------------------------------
  useEffect(() => {
    try {
      const year = new Date().getFullYear();
      console.assert(!!QUOTES_BY_LANG && Array.isArray(QUOTES_BY_LANG.en) && Array.isArray(QUOTES_BY_LANG.kk), "QUOTES_BY_LANG present");
      console.assert(lifespan(2000, 2020, "kk") === "20 жыл", "lifespan with deathYear");
      console.assert(lifespan(year - 5, null, "kk") === "5 жыл", "lifespan living");
      console.assert(I18N.en.fields === "Fields" && I18N.kk.fields === "Салалар", "i18n fields");
      console.assert(["map","dashboard","quotes"].includes(route), "route valid");
      // extra sanity tests
      const journalismCount = peopleData.filter(p => (p.fields||[]).includes("Журналистика") || (p.fields_en||[]).includes("Journalism")).length;
      console.assert(journalismCount > 0, "filter by field returns some results");
      console.log("DEV TESTS OK ✔");
    } catch (e) {
      console.warn("DEV TESTS WARN:", e);
    }
  }, [route]);

  // Sidebar helper
  const NavBtn = ({ id, label, icon }: { id: Route; label: string; icon: React.ReactNode }) => {
    const isActive = route === id;
    const isDimmed = !!activePerson;
    return (
      <button
        onClick={() => setRoute(id)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
          isActive ? "bg-purple-600 text-white" : "bg-white text-purple-700 hover:bg-purple-50"
        } ${isDimmed ? "opacity-30 pointer-events-none" : ""} border border-purple-200 w-full text-left`}
        aria-current={isActive ? "page" : undefined}
        disabled={isDimmed}
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-800 font-sans">
      {/* Header */}
      <section className="px-5 md:px-10 py-4 md:py-6 border-b bg-gradient-to-br from-purple-50 via-amber-50 to-purple-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-end gap-3">
            <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-2xl md:text-4xl font-serif tracking-tight text-purple-800">
              {t("title")}
            </motion.h1>
            <span className="hidden md:inline text-sm text-slate-600">{t("roleModels")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 mr-1">{t("langLabel")}:</span>
            <div className="inline-flex rounded-xl overflow-hidden border border-purple-200">
              <button className={`px-3 py-1 text-sm ${lang === "kk" ? "bg-purple-600 text-white" : "bg-white text-purple-700"}`} onClick={() => setLang("kk")}>
                KK
              </button>
              <button className={`px-3 py-1 text-sm ${lang === "en" ? "bg-purple-600 text-white" : "bg-white text-purple-700"}`} onClick={() => setLang("en")}>
                EN
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Body with mini sidebar */}
      <div className={`max-w-7xl mx-auto px-5 md:px-10 py-6 grid gap-6 ${mapOpen ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)]'}`}>
        {!mapOpen && (
          <aside className="md:sticky md:top-4 flex md:flex-col gap-2 z-10">
            <NavBtn id="map" label={t("navMap")} icon={<MapPin className="h-4 w-4" />} />
            <NavBtn id="dashboard" label={t("navDashboard")} icon={<Users2 className="h-4 w-4" />} />
            <NavBtn id="quotes" label={t("navQuotes")} icon={<Quote className="h-4 w-4" />} />
          </aside>
        )}

        <main className="space-y-8">
          {/* MAP PAGE */}
          {route === "map" && (
            <Card className="rounded-2xl shadow-sm border-purple-200/60">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2 text-purple-900">
                  <MapPin className="h-5 w-5 text-amber-500" />
                  {t("inspirationalMap")}
                </CardTitle>
                <Dialog open={mapOpen} onOpenChange={setMapOpen}>
                  <Button variant="secondary" className="rounded-xl bg-amber-400 text-white hover:bg-amber-500" onClick={()=>setMapOpen(true)}>
                    <Maximize2 className="h-4 w-4 mr-2" /> {t("expand")}
                  </Button>
                  {mapOpen && (
                    <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 overflow-hidden bg-gradient-to-br from-purple-50 via-amber-50 to-white" style={{ margin: '0', padding: '0', width: '100vw', maxWidth: '100vw' }}>
                      <DialogHeader className="px-6 pt-6 pb-4 bg-white/80 backdrop-blur-sm border-b border-purple-200/50">
                        <div className="flex items-center justify-between">
                          <DialogTitle className="text-2xl font-serif text-purple-800 flex items-center gap-3">
                            <MapPin className="h-6 w-6 text-amber-500" />
                            {t("exploreWorld")}
                          </DialogTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">{peopleData.length} {lang === "kk" ? "тұлға" : "people"}</span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setMapOpen(false)}
                              className="rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50"
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                          {lang === "kk" 
                            ? "Картадағы маркерлерді басып, тұлғалардың өмірбаянын көріңіз" 
                            : "Click on map markers to view biographies of remarkable people"
                          }
                        </p>
                      </DialogHeader>
                      <div className="p-6 h-full overflow-auto">
                        <MapWithPlaces people={peopleData} lang={lang} onSelectPerson={(p)=>setActivePerson(p)} />
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </CardHeader>
              <CardContent>
                <MapWithPlaces people={peopleData} lang={lang} onSelectPerson={(p)=>setActivePerson(p)} />
              </CardContent>
            </Card>
          )}

          {/* DASHBOARD PAGE */}
          {route === "dashboard" && (
            <>
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <h2 className="text-xl md:text-2xl font-semibold text-purple-900">{t("dashboardTitle")}</h2>
                <Input
                  placeholder={t("searchPlaceholder")}
                  className="rounded-xl"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((p) => {
                  const displayName = pick(p.name, p.name_en, lang) || p.name;
                  const displayFields = (pick(p.fields, p.fields_en, lang) || p.fields).join(", ");
                  return (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                      <Card className="group rounded-2xl border-purple-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 h-[500px] flex flex-col" onClick={() => setActivePerson(p)} role="button">
                        <CardHeader className="flex-shrink-0 p-0">
                          <Image src={p.photo} alt={displayName} width={800} height={256} className="rounded-2xl w-full h-64 object-cover" unoptimized />
                          <div className="p-4">
                            <CardTitle className="text-lg text-slate-800 line-clamp-2">{displayName}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-slate-600 flex-grow flex flex-col justify-between rounded-b-2xl">
                          <div className="space-y-2">
                            <div className="flex justify-between bg-purple-50 rounded-lg px-3 py-2">
                              <span className="font-medium">{t("lifespan")}</span>
                              <span>{lifespan(p.birthYear, p.deathYear, lang)}</span>
                            </div>
                            <div className="flex justify-between bg-amber-50 rounded-lg px-3 py-2">
                              <span className="font-medium">{t("fields")}</span>
                              <span className="text-right line-clamp-2">{displayFields}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* QUOTES PAGE */}
          {route === "quotes" && (
            <Card className="rounded-2xl border-amber-200 shadow-sm overflow-hidden">
              <CardHeader className="flex items-center gap-3">
                <CardTitle className="text-xl md:text-2xl flex items-center gap-2 text-purple-900">
                  <Quote className="h-5 w-5 text-amber-500" /> {t("quoteOfDay")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div key={quoteIndex} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }} className="bg-gradient-to-br from-amber-50 via-purple-50 to-white rounded-2xl p-6 md:p-8 text-center">
                  <blockquote className="font-serif italic text-xl md:text-2xl leading-relaxed text-slate-800">“{currentQuote.text}”</blockquote>
                  <div className="mt-3 text-sm text-slate-600">— {currentQuote.author}</div>
                </motion.div>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">{t("quotesRotate")}</div>
                <Button onClick={() => setQuoteIndex((prev) => (prev + 1) % quotes.length)} className="rounded-xl bg-purple-600 text-white hover:bg-purple-700">
                  <Sparkles className="h-4 w-4 mr-2" /> {t("newRandomQuote")}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* GLOBAL BIOGRAPHY MODAL — visible on any page */}
          <AnimatePresence>
            <Dialog open={!!activePerson} onOpenChange={(open) => { if (!open) setActivePerson(null); }}>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-amber-50/30 border-0 shadow-2xl">
                {activePerson && (
                  <>
                    <DialogHeader className="pb-4 border-b border-purple-200/50 bg-gradient-to-r from-purple-600 to-purple-700 text-white -m-6 mb-4 p-6 rounded-t-lg">
                      <DialogTitle className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-white/80"></div>
                        {pick(activePerson.name, activePerson.name_en, lang) || activePerson.name}
                      </DialogTitle>
                      <div className="flex items-center gap-4 mt-3 text-purple-100">
                        <span className="text-sm font-medium">
                          {activePerson.birthYear} - {activePerson.deathYear || lang === "kk" ? "қазір" : "present"}
                        </span>
                        <span className="text-purple-200">•</span>
                        <span className="text-sm">
                          {lifespan(activePerson.birthYear, activePerson.deathYear, lang)}
                        </span>
                      </div>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 overflow-y-auto max-h-[60vh]">
                      <div className="relative">
                        <Image src={activePerson.photo} alt={activePerson.name} width={800} height={600} className="rounded-2xl w-full h-auto object-cover shadow-lg border-4 border-white/50" unoptimized />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-amber-500 flex items-center justify-center shadow-lg">
                          <span className="text-white text-sm">👤</span>
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-4">
                        <div className="bg-gradient-to-r from-purple-50 to-amber-50 rounded-xl p-4 border border-purple-200/50">
                          <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                            <span className="text-lg">🎓</span>
                            {t("fields")}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {(pick(activePerson.fields, activePerson.fields_en, lang) || activePerson.fields).map((field, index) => (
                              <span 
                                key={index}
                                className="px-3 py-1 bg-white/80 text-purple-700 rounded-full text-sm font-medium border border-purple-200/50 shadow-sm"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {pick(activePerson.education, activePerson.education_en, lang) && (
                          <div className="bg-gradient-to-r from-amber-50 to-purple-50 rounded-xl p-4 border border-amber-200/50">
                            <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                              <span className="text-lg">📚</span>
                              {t("education")}
                            </h3>
                            <p className="text-amber-700 leading-relaxed">
                              {pick(activePerson.education, activePerson.education_en, lang)}
                            </p>
                          </div>
                        )}
                        
                        <div className="bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl p-4 border border-slate-200/50">
                          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="text-lg">📖</span>
                            {lang === "kk" ? "Өмірбаян" : "Biography"}
                          </h3>
                          <p className="leading-relaxed text-slate-700 text-base">
                            {pick(activePerson.bio, activePerson.bio_en, lang) || activePerson.bio}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </AnimatePresence>

          <footer className="pt-2 pb-6 text-center text-xs text-slate-500">{t("footer")}</footer>
        </main>
      </div>
    </div>
  );
}