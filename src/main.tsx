import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import posthog from 'posthog-js'
import App from './App'
import './index.css'

// 初始化 PostHog
posthog.init('YOUR_POSTHOG_API_KEY', {
  api_host: 'https://app.posthog.com',
  capture_pageview: true,
  capture_pageleave: true,
  disable_session_recording: false
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)
