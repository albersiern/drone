export interface TelemetryPosition {
  latitude: number
  longitude: number
  altitude: number
}

export interface TelemetryGimbal {
  pitch: number
  yaw: number
  roll: number
}

export interface TelemetryNavigation {
  satellites: number
  visual: boolean
  inertial: boolean
  isSpoofing: boolean
  isJamming: boolean
}

export interface TelemetryPayload {
  droneId: string
  serialNumber: string
  battery: number
  position: TelemetryPosition
  speed: number
  heading: number
  gimbal: TelemetryGimbal
  timestamp: number
  status: string
  navigation: TelemetryNavigation
}

export interface TelemetryMessage {
  type: 'TELEMETRY'
  payload: TelemetryPayload
}

export const exampleTelemetryMessage: TelemetryMessage = {
  type: 'TELEMETRY',
  payload: {
    droneId: 'drone-001',
    serialNumber: 'v1',
    battery: 85,
    position: {
      latitude: 53.902,
      longitude: 27.561,
      altitude: 120,
    },
    speed: 15,
    heading: 45,
    gimbal: {
      pitch: -30,
      yaw: 0,
      roll: 0,
    },
    timestamp: Date.now(),
    status: 'ACTIVE',
    navigation: {
      satellites: 8,
      visual: true,
      inertial: true,
      isSpoofing: false,
      isJamming: false,
    },
  },
}
