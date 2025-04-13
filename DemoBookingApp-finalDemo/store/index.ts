import { create } from 'zustand';

import { DriverStore, LocationStore, MarkerData, Coordinate } from '@/types/type';

export const useLocationStore = create<LocationStore>((set) => ({
    userAddress:null,
    userLongitude: null,
    userLatitude: null,
    destinationLongitude: null,
    destinationLatitude: null,
    destinationAddress: null,
    routeMap: null,
    setUserLocation: ({ 
        latitude, longitude, address
    }: { 
        latitude: number, longitude: number, address: string 
    }) => {
        set(() => ({
            userLatitude: latitude,
            userLongitude: longitude,
            userAddress: address
        }))
    },
    setDestinationLocation: ({ 
        latitude, longitude, address
    }: { 
        latitude: number, longitude: number, address: string 
    }) => {
        console.log("index.ts: ",latitude, longitude, address)
        set(() => ({
            destinationLatitude: latitude,
            destinationLongitude: longitude,
            destinationAddress: address
        }))
    },
    setRoutes: (routes: Coordinate[]) => {
        set(() => ({
            routeMap: routes
        }))
    }
    
}))

export const useDriverStore = create<DriverStore>((set) => ({
    drivers: [] as MarkerData[],
    selectedDriver: null,
    setSelectedDriver: (driveId: number) => set(() => ({ selectedDriver: driveId })),
    setDrivers: (drivers: MarkerData[]) => set(() => ({ drivers: drivers })),
    clearSelectedDriver: () => set(() => ({ selectedDriver: null })),
}))