import './App.css'
import VideoBackground from './components/VideoBackground'
import CesiumPanel from './components/CesiumPanel'
import SceneRoot from './three/SceneRoot'
import { useEffect } from 'react'
import { connectWS } from './services/ws'

function App() {


  return (
    <div className="split-container">
      <div className="map-pane">
        <CesiumPanel />
      </div>

      <div className="video-pane ar-container">
        <VideoBackground src="/DJI_0381.mp4" />
        <SceneRoot />
      </div>
    </div>
  )
}

export default App
