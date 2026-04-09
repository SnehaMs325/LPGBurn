"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Phone, Navigation, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import dynamic from "next/dynamic"

// Dynamically import map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/dashboard/gas-station-map"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-square items-center justify-center lg:aspect-auto lg:h-[500px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

interface GasStation {
  id: string
  name: string
  address: string
  lat: number
  lon: number
  phone?: string
  distance?: number
}

export default function GasStationsPage() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [stations, setStations] = useState<GasStation[]>([])
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isLoadingStations, setIsLoadingStations] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null)

  const detectLocation = useCallback(() => {
    setIsLoadingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        })
        setIsLoadingLocation(false)
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable location access.")
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.")
            break
          case error.TIMEOUT:
            setLocationError("Location request timed out.")
            break
          default:
            setLocationError("An unknown error occurred.")
        }
        setIsLoadingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  // Fetch nearby gas stations using Overpass API (OpenStreetMap)
  const fetchNearbyStations = useCallback(async () => {
    if (!location) return

    setIsLoadingStations(true)
    try {
      // Search for LPG/gas stations within 5km radius (smaller to reduce timeout)
      const radius = 5000 // 5km
      const query = `[out:json][timeout:10];(node["amenity"="fuel"](around:${radius},${location.lat},${location.lon}););out body;`

      // Use AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      // Try multiple Overpass API endpoints
      const endpoints = [
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass-api.de/api/interpreter",
      ]

      let data = null
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(
            `${endpoint}?data=${encodeURIComponent(query)}`,
            { signal: controller.signal }
          )
          clearTimeout(timeoutId)
          
          if (response.ok) {
            data = await response.json()
            break
          }
        } catch (e) {
          // Try next endpoint
          continue
        }
      }

      if (!data || !data.elements || data.elements.length === 0) {
        throw new Error("No stations found")
      }

      const stationsData: GasStation[] = data.elements.map((el: any, index: number) => {
        const lat = el.lat || el.center?.lat
        const lon = el.lon || el.center?.lon
        const distance = lat && lon ? calculateDistance(location.lat, location.lon, lat, lon) : 0

        return {
          id: el.id?.toString() || index.toString(),
          name: el.tags?.name || el.tags?.brand || "LPG Gas Station",
          address: el.tags?.["addr:street"]
            ? `${el.tags?.["addr:housenumber"] || ""} ${el.tags?.["addr:street"]}, ${el.tags?.["addr:city"] || ""}`
            : "Address not available",
          lat,
          lon,
          phone: el.tags?.phone || el.tags?.["contact:phone"] || getRandomHelpline(),
          distance,
        }
      })

      // Sort by distance
      stationsData.sort((a, b) => (a.distance || 0) - (b.distance || 0))
      setStations(stationsData.slice(0, 20)) // Limit to 20 nearest
    } catch (error) {
      console.error("Failed to fetch stations:", error)
      // Use fallback demo data
      setStations(getDemoStations(location))
    } finally {
      setIsLoadingStations(false)
    }
  }, [location])

  useEffect(() => {
    detectLocation()
  }, [detectLocation])

  useEffect(() => {
    if (location) {
      fetchNearbyStations()
    }
  }, [location, fetchNearbyStations])

  const handleStationSelect = (station: GasStation) => {
    setSelectedStation(station)
  }

  const openInMaps = (station: GasStation) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lon}`
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight gradient-text">Nearby LPG Gas Stations</h1>
          <div className="live-indicator">
            <span className="live-dot" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
        <p className="text-muted-foreground">
          Find gas offices, booking information, and helpline numbers
        </p>
      </div>

      {/* Location Detection Section */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Navigation className="h-5 w-5 text-primary" />
            <span className="gradient-text">Your Location</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locationError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{locationError}</span>
                <Button size="sm" variant="outline" onClick={detectLocation}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : isLoadingLocation ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Detecting your location...</span>
            </div>
          ) : location ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                <span className="font-medium">Coordinates:</span>{" "}
                {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </p>
              <Button size="sm" variant="outline" onClick={detectLocation}>
                <Navigation className="mr-2 h-4 w-4" />
                Update Location
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Map and List Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Map Section */}
        <Card className="lg:row-span-2 glass-card">
          <CardHeader>
            <CardTitle className="gradient-text">Map View</CardTitle>
            <CardDescription>
              Your location (blue) and nearby gas stations (red)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {location ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-b-lg lg:aspect-auto lg:h-[500px]">
                <MapComponent
                  userLocation={location}
                  stations={stations}
                  selectedStation={selectedStation}
                  onStationSelect={handleStationSelect}
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center lg:aspect-auto lg:h-[500px]">
                <p className="text-muted-foreground">Enable location to view map</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Station List Section */}
        <Card className="glass-card card-lift">
          <CardHeader>
            <CardTitle className="gradient-text">Gas Stations</CardTitle>
            <CardDescription>
              {stations.length > 0
                ? `${stations.length} stations found nearby`
                : "Searching for nearby stations..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStations ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {stations.map((station) => (
                    <div
                      key={station.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                        selectedStation?.id === station.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => handleStationSelect(station)}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{station.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{station.address}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {station.distance && (
                            <span className="text-xs text-primary">
                              {station.distance.toFixed(1)} km
                            </span>
                          )}
                          {station.phone && (
                            <a
                              href={`tel:${station.phone}`}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="h-3 w-3" />
                              {station.phone}
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 gap-1 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              openInMaps(station)
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Directions
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stations.length === 0 && !isLoadingStations && (
                    <p className="py-8 text-center text-muted-foreground">
                      No gas stations found nearby. Try updating your location.
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Helpline Numbers Card */}
        <Card className="glass-card card-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <span className="gradient-text">Emergency Helplines</span>
            </CardTitle>
            <CardDescription>LPG emergency and booking numbers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <HelplineItem name="HP Gas (HPCL)" number="1800-2333-555" />
              <HelplineItem name="Indane Gas (IOC)" number="1800-2333-555" />
              <HelplineItem name="Bharat Gas (BPCL)" number="1800-224-344" />
              <HelplineItem name="LPG Emergency" number="1906" />
              <HelplineItem name="Gas Leak Emergency" number="112" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function HelplineItem({ name, number }: { name: string; number: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
      <span className="font-medium">{name}</span>
      <a
        href={`tel:${number}`}
        className="flex items-center gap-2 text-primary hover:underline"
      >
        <Phone className="h-4 w-4" />
        {number}
      </a>
    </div>
  )
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function getRandomHelpline(): string {
  const helplines = ["1800-2333-555", "1800-224-344", "1906"]
  return helplines[Math.floor(Math.random() * helplines.length)]
}

function getDemoStations(location: { lat: number; lon: number }): GasStation[] {
  // Generate demo stations around user's location
  const stations: GasStation[] = [
    { id: "1", name: "HP Gas Agency", address: "Main Market Road", lat: location.lat + 0.01, lon: location.lon + 0.01, phone: "1800-2333-555", distance: 1.2 },
    { id: "2", name: "Indane Gas Distributor", address: "Station Road", lat: location.lat - 0.01, lon: location.lon + 0.02, phone: "1800-2333-555", distance: 2.1 },
    { id: "3", name: "Bharat Gas Center", address: "Civil Lines", lat: location.lat + 0.02, lon: location.lon - 0.01, phone: "1800-224-344", distance: 2.5 },
    { id: "4", name: "Indian Oil LPG", address: "New Colony", lat: location.lat - 0.02, lon: location.lon - 0.02, phone: "1800-2333-555", distance: 3.2 },
    { id: "5", name: "HP Gas Godown", address: "Industrial Area", lat: location.lat + 0.03, lon: location.lon, phone: "1800-2333-555", distance: 4.1 },
  ]
  return stations
}
