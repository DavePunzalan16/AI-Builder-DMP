import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { GuestLayout, AuthLayout } from './pages/Layout.jsx'
import AuthPage from './pages/AuthPage.jsx'
import HomePage from './pages/HomePage.jsx'
import BuilderPage from './pages/BuilderPage.jsx'
import PreviewPage from './pages/PreviewPage.jsx'
import { Toaster } from 'react-hot-toast'
import PublishPage from './pages/PublishPage.jsx'

const App = () => {
  return (
    <>
      <Toaster />
      <Routes>
        {/* Login Routes */}
        <Route element={<GuestLayout />}>
          <Route path='/login' element={<AuthPage mode="login" />} />
          <Route path='/register' element={<AuthPage mode="register" />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<AuthLayout />}>
          <Route path='/' element={<HomePage />} />
          <Route path='/builder/:id' element={<BuilderPage />} />
          <Route path='/preview/:id' element={<PreviewPage />} />
        </Route>

        {/* Public Routes */}
        <Route path='/publish/:id' element={<PublishPage />} />

        {/* Catch-All */}
        <Route path='*' element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App