import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import './index.css'

// Hash router untuk GitHub Pages (deep link aman tanpa konfigurasi server)
const Router = import.meta.env.VITE_USE_HASH === 'false' ? BrowserRouter : HashRouter

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <ToastProvider>
        <DataProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </DataProvider>
      </ToastProvider>
    </Router>
  </React.StrictMode>
)
