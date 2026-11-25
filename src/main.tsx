import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { queryClient, router } from './app/router'
import './index.css'

document.documentElement.dataset.theme = localStorage.getItem('ambiente:theme') || 'auto'

createRoot(document.getElementById('root')!).render(
  <StrictMode><QueryClientProvider client={queryClient}><MotionConfig reducedMotion="user"><LazyMotion features={domAnimation}><RouterProvider router={router} /></LazyMotion></MotionConfig></QueryClientProvider></StrictMode>,
)
