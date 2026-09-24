import { FileCodeIcon, FileTextIcon, FolderOpenIcon } from 'lucide-react';
import React, { useMemo } from 'react'

function buildTree(paths) {
  const root = [];
  for (const filePath of paths.sort()) {
    const parts = filePath.split("/").filter(Boolean)
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = "/" + parts.slice(0, i + 1).join("/");
      let existing = current.find((n) => n.name === name)
      if (!existing) {
        existing = {
          name,
          path: fullPath,
          isDir: !isLast,
          children: [],
        };
        current.push(existing);
      }
      current = existing.children;
    }
  }
  return root;
}

function getFileIcon(name, darkMode) {
  if (name.endsWith(".css")) return <FileTextIcon size={14} className={darkMode ? 'text-sky-400' : 'text-sky-500'} />
  if (name.endsWith(".jsx") || name.endsWith(".js")) return <FileCodeIcon size={14} className={darkMode ? 'text-amber-400' : 'text-amber-500'} />
  if (name.endsWith(".json")) return <FileTextIcon size={14} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} />
  return <FileTextIcon size={14} className={darkMode ? 'text-white/40' : 'text-zinc-400'} />
}

function TreeItem({ node, activeFile, onFileSelect, depth = 0, darkMode }) {
  const isActive = node.path === activeFile;

  if (node.isDir) {
    return (
      <div>
        <div
          className={`flex items-center gap-2 py-1 px-2 text-xs select-none transition-colors ${
            darkMode ? "text-white/50" : "text-zinc-400"
          }`}
          style={{ paddingLeft: (depth * 12 + 8) + "px" }}
        >
          <FolderOpenIcon
            size={18}
            className={darkMode ? "text-amber-400/70" : "text-amber-600/70"}
          />

          <span>{node.name}</span>
        </div>

        {node.children.map((child) => (
          <TreeItem
            key={child.path}
            node={child}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
            depth={depth + 1}
            darkMode={darkMode}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileSelect(node.path)}
      className={`w-full flex items-center gap-2 py-1.5 px-2 text-xs transition-colors rounded-md cursor-pointer ${
        isActive
          ? darkMode
            ? "bg-white/10 text-white font-medium"
            : "bg-zinc-100 text-zinc-950 font-medium"
          : darkMode
            ? "text-white/60 hover:bg-white/5 hover:text-white"
            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
      style={{ paddingLeft: (depth * 12 + 8) + "px" }}
    >
      {getFileIcon(node.name, darkMode)}

      <span className="truncate">{node.name}</span>
    </button>
  );
}

const FileExplorer = ({ files, activeFile, onFileSelect, darkMode }) => {

  const tree = useMemo(() => buildTree(Object.keys(files)), [files])

  return (
    <div className='py-2 overflow-y-auto hide-scrollbar'>
      <p className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-widest ${
        darkMode ? "text-white/30" : "text-zinc-400"
      }`}>
        Files</p>
      {tree.map((node) => (
        <TreeItem key={node.path} node={node} activeFile={activeFile}
          onFileSelect={onFileSelect} darkMode={darkMode} />
      ))}
    </div>
  )
}

export default FileExplorer