import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initNativeApp } from '@/lib/nativeApp'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// No-op on the web; sets up status bar/splash/back-button on iOS.
initNativeApp();
