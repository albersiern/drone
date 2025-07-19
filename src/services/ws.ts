import { io, Socket } from 'socket.io-client'
import { Vector3, Euler } from 'three'
import { useTelemetryStore } from '../stores/telemetry'
import { usePOIStore } from '../stores/poi'

let socket: Socket | null = null

export function connectWS(url = 'ws://localhost:3000') {
  if (socket) return socket
  socket = io(url)

  socket.on('telemetry', (data) => {
    const pos = new Vector3(data.alt, 0, 0) 
    const rot = new Euler(data.pitch, data.yaw, data.roll)
    useTelemetryStore.getState().setTelemetry(pos, rot)
  })

  socket.on('poi', (list) => {
    const pois = list.map((p: any) => ({
      id: p.id,
      name: p.name,
      position: new Vector3(p.alt, 0, 0),
    }))
    usePOIStore.getState().setPOIs(pois)
  })

  return socket
}
