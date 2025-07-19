import { Vector3 } from 'three'
import { create } from 'zustand'

export interface POI {
  id: string
  name: string
  position: Vector3
}

interface POIState {
  pois: POI[]
  setPOIs: (list: POI[]) => void
}

export const usePOIStore = create<POIState>((set) => ({
  pois: [
    {
      id: 'central_road',
      name: 'POI',
      position: new Vector3(27.544722, 53.9125, 20),
    },
  ],
  setPOIs: (list) => set({ pois: list }),
}))
