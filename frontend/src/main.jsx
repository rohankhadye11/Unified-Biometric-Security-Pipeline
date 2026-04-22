import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
            fontSize: '0.9rem',
            padding: '14px 18px',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
