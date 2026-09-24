import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import BuilderHeader from '../components/BuilderHeader'
import { MessageSquare, FolderTreeIcon } from "lucide-react";
import ChatPanel from '../components/ChatPanel'
import FileExplorer from '../components/FileExplorer'
import PreviewPanel from '../components/PreviewPanel'
import AgentProgressDashboard from '../components/AgentProgressDashboard'
import PublishModal from '../components/PublishModal'
import api from '../api/api'
import toast from 'react-hot-toast'
import { exportProjectZip } from '../utils/exportProject';

const BuilderPage = () => {

  const { id } = useParams()
  const navigate = useNavigate()
  const [leftTab, setLeftTab] = useState("chat");
  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const { activeProject, loadingActiveProject, activeFile, showCode, setActiveFile,
    setShowCode, loadProject, logout, chatLoading, handleChat } = useAppContext();

  useEffect(() => {
    if (!id) return;
    loadProject(id)
  }, [id])

  useEffect(() => {
    if (!id || !activeProject) return;
    if (activeProject.status === "pending" || activeProject.status === "generating") {
      const interval = setInterval(() => {
        loadProject(id, true)
      }, 1500)
      return () => clearInterval(interval)
    }
  }, [id, loadProject, activeProject])

  const handlePublish = async () => {
  if (!id) return;
  setPublishing(true);
  try {
    await api.post(`/api/projects/${id}/publish`);
    const url = `${window.location.origin}/publish/${id}`;
    setPublishUrl(url);
    toast.success("Website published successfully!");
  } catch (err) {
    console.error("Publish failed:", err);
    toast.error(
      err?.response?.data?.error || "Publish failed"
    );
  }finally{
    setPublishing(false);
  }
};

  const handleDownload = () => {
    if(!activeProject) return;
    exportProjectZip(activeProject)
  };

  const handleOpenPreview = () => {
    if (!id) return;
    window.open(`/preview/${id}`, "_blank");
  };

  if (loadingActiveProject || !activeProject) {
    return <Loading />
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden relative transition-colors duration-300 ${darkMode
        ? "bg-[radial-gradient(ellipse_at_top,#0a1f14,#020805)] text-white"
        : "bg-white text-zinc-900"
      }`}>
      {/* Top Bar Header */}
      <BuilderHeader
        projectName={activeProject.name}
        version={activeProject.version}
        showCode={showCode}
        publishing={publishing}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onToggleShowCode={() => setShowCode(!showCode)}
        onOpenPreview={handleOpenPreview}
        onPublish={handlePublish}
        onDownload={handleDownload}
        onBack={() => navigate("/")}
        onLogout={logout} />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className={`w-[320px] shrink-0 flex flex-col border-r transition-colors duration-300 ${darkMode
            ? "border-white/10 bg-transparent"
            : "border-zinc-200 bg-white"
          }`}>
          {/* Sidebar Tabs */}
          <div className={`flex border-b transition-colors duration-300 ${darkMode ? "border-white/10" : "border-zinc-100"}`}>
            <button
              onClick={() => setLeftTab("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer transition-colors ${leftTab === "chat"
                  ? darkMode
                    ? "text-white border-b-2 border-white"
                    : "text-zinc-900 border-b-2 border-zinc-900"
                  : darkMode
                    ? "text-white/40 hover:text-white/80"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
            >
              <MessageSquare size={13} /> Chat
            </button>

            <button
              onClick={() => setLeftTab("files")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer transition-colors ${leftTab === "files"
                  ? darkMode
                    ? "text-white border-b-2 border-white"
                    : "text-zinc-900 border-b-2 border-zinc-900"
                  : darkMode
                    ? "text-white/40 hover:text-white/80"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
            >
              <FolderTreeIcon size={13} /> Files
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-hidden">
            {
              leftTab === 'chat' ? (
                <ChatPanel
                  messages={activeProject.messages}
                  onSend={handleChat}
                  loading={chatLoading}
                  darkMode={darkMode}
                />
              ) : (
                <FileExplorer
                  files={activeProject.files}
                  activeFile={activeFile}
                  darkMode={darkMode}
                  onFileSelect={(path) => {
                    setActiveFile(path);
                    setShowCode(true)
                  }}
                />
              )
            }
          </div>
        </div>
        {/* Preview / Code Area */}
        <div className="flex-1 overflow-hidden">
          {activeProject.status === "pending" ||
          activeProject.status === "generating" ||
          activeProject.status === "failed" ? (
            <AgentProgressDashboard project={activeProject} />
          ) : (
            <PreviewPanel project={activeProject} activeFile={activeFile} showCode={showCode} darkMode={darkMode} />
          )}
        </div>
      </div>

      {publishUrl && <PublishModal publishUrl={publishUrl} onClose={()=> setPublishUrl(null)}/>}
    </div>
  )
}

export default BuilderPage