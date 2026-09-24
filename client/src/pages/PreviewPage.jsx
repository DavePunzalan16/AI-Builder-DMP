import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import FullPagePreivew from '../components/FullPagePreivew'
import { useAppContext } from '../context/AppContext'

const PreviewPage = () => {
  const { id } = useParams()
  const {activeProject: project, loadingActiveProject: loading, loadProject} = useAppContext()

  useEffect(() => {
    if(id) {
      loadProject(id)
    }
  }, [id])

  if (loading || !project) {
    return <Loading />
  }

  return (
    <FullPagePreivew files={project.files}/>
  )
}

export default PreviewPage