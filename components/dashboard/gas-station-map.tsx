"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface GasStation {
  id: string
  name: string
  address: string
  lat: number
  lon: number
  phone?: string
  distance?: number
}

interface MapComponentProps {
  userLocation: { lat: number; lon: number }
  stations: GasStation[]
  selectedStation: GasStation | null
  onStationSelect: (station: GasStation) => void
}

// Custom marker icons
const userIcon = L.divIcon({
  className: "custom-marker",
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const stationIcon = L.divIcon({
  className: "custom-marker",
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #ef4444;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const selectedStationIcon = L.divIcon({
  className: "custom-marker",
  html: `
    <div style="
      width: 28px;
      height: 28px;
      background: #22c55e;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 3px 10px rgba(0,0,0,0.4);
      animation: pulse 1.5s infinite;
    "></div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    </style>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

export default function MapComponent({
  userLocation,
  stations,
  selectedStation,
  onStationSelect,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Create map
    const map = L.map(containerRef.current, {
      center: [userLocation.lat, userLocation.lon],
      zoom: 13,
      zoomControl: true,
    })

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Add user location marker
    const userMarker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
      .addTo(map)
      .bindPopup("<strong>Your Location</strong>")

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [userLocation.lat, userLocation.lon])

  // Update markers when stations change
  useEffect(() => {
    if (!mapRef.current) return

    // Remove existing station markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add station markers
    stations.forEach((station) => {
      if (!station.lat || !station.lon) return

      const isSelected = selectedStation?.id === station.id
      const icon = isSelected ? selectedStationIcon : stationIcon

      const marker = L.marker([station.lat, station.lon], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div style="min-width: 150px;">
            <strong>${station.name}</strong>
            <br />
            <small>${station.address}</small>
            ${station.distance ? `<br /><small style="color: #16a34a;">${station.distance.toFixed(1)} km away</small>` : ""}
            ${station.phone ? `<br /><a href="tel:${station.phone}" style="color: #2563eb;">${station.phone}</a>` : ""}
          </div>
        `)

      marker.on("click", () => {
        onStationSelect(station)
      })

      markersRef.current.push(marker)
    })

    // Fit bounds to include all markers if we have stations
    if (stations.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lon],
        ...stations.filter(s => s.lat && s.lon).map((s) => [s.lat, s.lon] as [number, number]),
      ])
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [stations, selectedStation, onStationSelect, userLocation])

  // Center on selected station
  useEffect(() => {
    if (!mapRef.current || !selectedStation) return

    mapRef.current.setView([selectedStation.lat, selectedStation.lon], 15, {
      animate: true,
      duration: 0.5,
    })

    // Open popup for selected station
    const marker = markersRef.current.find(
      (m) => m.getLatLng().lat === selectedStation.lat && m.getLatLng().lng === selectedStation.lon
    )
    if (marker) {
      marker.openPopup()
    }
  }, [selectedStation])

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: "400px" }}
    />
  )
}
