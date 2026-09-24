import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react'
import api from '../api/api'
import Loading from '../components/Loading'
import { detectDependencies } from '../utils/sandpackUtils'
import { AlertTriangleIcon } from 'lucide-react'

const PublishPage = () => {
  const { id } = useParams()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get(`/api/projects/public/${id}`)
        setProject(data)
      } catch (err) {
        console.error('Failed to load published project:', err)
        setError(
          err?.response?.data?.error || 'This website is unavailable or hasn\'t been published yet.'
        )
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchProject()
  }, [id])

  if (loading) {
    return <Loading />
  }

  if (error || !project) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-50 text-center px-6">
        <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangleIcon size={22} className="text-red-500" />
        </div>
        <h1 className="text-lg font-semibold text-zinc-900 mb-1">Website Unavailable</h1>
        <p className="text-sm text-zinc-500 max-w-sm">{error}</p>
      </div>
    )
  }

  const sandpackFiles = {}
  for (const [path, content] of Object.entries(project.files)) {
    const fileCode = typeof content === 'string' ? content : content?.content || ''
    sandpackFiles[path] = { code: fileCode }
  }

  const dependencies = detectDependencies(project.files)

  return (
    <div className="h-screen w-full">
      <SandpackProvider
        template="react"
        files={sandpackFiles}
        customSetup={{ dependencies }}
        options={{
          externalResources: [
            'https://cdn.tailwindcss.com',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
          ],
          logLevel: 0,
        }}
      >
        <SandpackPreview
          showNavigator={false}
          showRefreshButton={false}
          showOpenInCodeSandbox={false}
          style={{ height: '100vh', width: '100%', border: 'none' }}
        />
      </SandpackProvider>
    </div>
  )
}

export default PublishPage