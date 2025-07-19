import { Vector3, Euler } from 'three'
import { create } from 'zustand'

interface TelemetryState {
  position: Vector3
  rotation: Euler
  setTelemetry: (pos: Vector3, rot: Euler) => void
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  position: new Vector3(0, 50, 200),
  rotation: new Euler(),
  setTelemetry: (pos, rot) => set({ position: pos, rotation: rot }),
}))
