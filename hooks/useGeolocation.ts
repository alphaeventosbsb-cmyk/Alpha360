'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { updateUser, saveLocation, createAlert } from '@/lib/firestore-service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { LocationStatus } from '@/lib/types';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number | null;
  error: string | null;
  isTracking: boolean;
  distanceToSite: number | null;
  isInsideGeofence: boolean;
}

interface UseGeolocationOptions {
  guardId: string;
  guardName?: string;
  jobId?: string;
  companyId?: string;
  siteLat?: number;
  siteLng?: number;
  geofenceRadius?: number; // meters, default 200
  updateInterval?: number; // ms, default 30000
  enabled?: boolean;
}

// Haversine formula — meters
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useGeolocation(options: UseGeolocationOptions): GeolocationState {
  const {
    guardId,
    guardName,
    jobId,
    companyId,
    siteLat,
    siteLng,
    geofenceRadius = 200,
    updateInterval = 30000,
    enabled = true,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    speed: null,
    heading: null,
    timestamp: null,
    error: null,
    isTracking: false,
    distanceToSite: null,
    isInsideGeofence: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const lastFirestoreUpdateRef = useRef<number>(0);
  const lastLocationSaveRef = useRef<number>(0);
  const arrivalAlertSentRef = useRef<boolean>(false);
  const mountedRef = useRef(true);

  // Sync to Firestore (update user document with lat/lng)
  const syncToFirestore = useCallback(async (lat: number, lng: number) => {
    const now = Date.now();
    if (now - lastFirestoreUpdateRef.current < updateInterval) return;
    lastFirestoreUpdateRef.current = now;

    try {
      await updateUser(guardId, {
        lat,
        lng,
        lastLocationUpdate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Geolocation] Error syncing to Firestore:', error);
    }
  }, [guardId, updateInterval]);

  // Save location history
  const saveLocationHistory = useCallback(async (lat: number, lng: number, status: LocationStatus = 'active') => {
    const now = Date.now();
    // Save history every 60 seconds
    if (now - lastLocationSaveRef.current < 60000) return;
    lastLocationSaveRef.current = now;

    try {
      await saveLocation({
        guardId,
        guardName,
        jobId,
        companyId,
        lat,
        lng,
        status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Geolocation] Error saving location history:', error);
    }
  }, [guardId, guardName, jobId, companyId]);

  // Check geofence and send arrival alert
  const checkGeofence = useCallback(async (lat: number, lng: number) => {
    if (!siteLat || !siteLng) return;

    const distance = getDistanceMeters(lat, lng, siteLat, siteLng);
    const inside = distance <= geofenceRadius;

    setState(prev => ({
      ...prev,
      distanceToSite: Math.round(distance),
      isInsideGeofence: inside,
    }));

    // Send arrival alert only once per session
    if (inside && !arrivalAlertSentRef.current && jobId && companyId) {
      arrivalAlertSentRef.current = true;
      try {
        // Get contractor ID from job
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));
        const contractorId = jobDoc.exists() ? jobDoc.data().contractorId : undefined;

        await createAlert({
          type: 'arrival',
          jobId,
          guardId,
          guardName,
          companyId,
          contractorId,
          lat,
          lng,
          message: `${guardName || 'Vigilante'} chegou ao local da escala (${Math.round(distance)}m do posto)`,
          status: 'resolved',
        });
      } catch (error) {
        console.error('[Geolocation] Error sending arrival alert:', error);
      }
    }
  }, [siteLat, siteLng, geofenceRadius, jobId, companyId, guardId, guardName]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !guardId) {
      setState(prev => ({ ...prev, isTracking: false }));
      return;
    }

    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocalização não suportada neste dispositivo.',
        isTracking: false,
      }));
      return;
    }

    // High accuracy options — fast initial response
    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 10000, // Accept cached position up to 10s for fast initial response
      timeout: 15000,
    };

    // Get an immediate position first for fast response
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        setState(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          speed,
          heading,
          timestamp: position.timestamp,
          error: null,
          isTracking: true,
        }));
        // Initial sync
        syncToFirestore(latitude, longitude);
        saveLocationHistory(latitude, longitude);
        checkGeofence(latitude, longitude);
      },
      (error) => {
        if (!mountedRef.current) return;
        console.error('[Geolocation] Initial position error:', error);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 5000 }
    );

    // Then continuous watch for ongoing tracking
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!mountedRef.current) return;
        const { latitude, longitude, accuracy, speed, heading } = position.coords;

        setState(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          speed,
          heading,
          timestamp: position.timestamp,
          error: null,
          isTracking: true,
        }));

        // Sync to Firestore every updateInterval (30s)
        syncToFirestore(latitude, longitude);

        // Save to location history every 60s
        saveLocationHistory(latitude, longitude);

        // Check geofence proximity
        checkGeofence(latitude, longitude);
      },
      (error) => {
        if (!mountedRef.current) return;
        let errorMsg = 'Erro ao obter localização.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Permissão de localização negada. Ative nas configurações do navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Localização indisponível. Verifique o GPS.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Tempo esgotado ao obter localização.';
            break;
        }
        setState(prev => ({ ...prev, error: errorMsg }));
      },
      geoOptions
    );

    watchIdRef.current = watchId;

    return () => {
      mountedRef.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, guardId, syncToFirestore, saveLocationHistory, checkGeofence]);

  return state;
}
