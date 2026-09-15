import { useState } from 'react'
import './App.css'

function App() {

  return (
    <div>
      <button onClick={() => {
        window.musicAPI.start('first')
      }}>
        Start
      </button>

      <button onClick={() => {

      }}>Play</button>

      <button onClick={() => {

      }}>Pause</button>

    </div>
  )
}

export default App
