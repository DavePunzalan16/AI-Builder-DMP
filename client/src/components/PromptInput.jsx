import React, { useState, useRef, useEffect } from 'react'
import { ArrowRightIcon, CloudUploadIcon, Loader2Icon, MicIcon } from "lucide-react"

const PromptInput = ({
  onSubmit,
  loading = false,
  placeholder = "Describe the website you wanted to build...",
  large = false,
  autoFocus = false,
  variant = "default",
  darkMode = false
}) => {

  const [value, setValue] = useState("");
  const textareaRef = useRef(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus])

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || loading) return;
    onSubmit(trimmed)
    setValue("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit()
    }
  }

  if (variant === "glass") {
    return (
      <form onSubmit={handleSubmit} className='max-w-2xl w-full mx-auto bg-white/10 backdrop-blur-xl rounded-xl ring-1
        ring-white/25 focus-within:ring-2 focus-within:ring-white/30 overflow-hidden mt-6 transition'>

        <textarea ref={textareaRef} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} disabled={loading}
          rows={3} className='w-full p-4 pb-2 resize-none placeholder:text-white/60 outline-none bg-transparent text-white text-base' />
        <div className='flex items-center justify-between pb-3 px-3 gap-2'>
          <label htmlFor='file' className='border border-white/20 text-white/80 hover:text-white hover:border-white/30 p-2 rounded-md cursor-pointer flex items-center justify-center'>
            <input type="file" id='file' hidden />
            <CloudUploadIcon size={20} />
          </label>
          <div className='flex items-center justify-end gap-2'>
            <button type="button" className='flex items-center justify-center p-1 text-white/70 hover:text-white cursor-pointer'>
              <MicIcon size={20} />
            </button>

            <button type="submit"
              disabled={!value.trim() || loading}
              className='flex items-center justify-center p-2 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer'>
              {loading ? <Loader2Icon size={20} className='animate-spin' /> :
                <ArrowRightIcon size={20} />}
            </button>
          </div>
        </div>
      </form>
    )
  }

  return (
    <div className={`flex items-end gap-2 rounded-xl transition-all duration-300 ${large ? "p-4" : "p-3"} ${
      darkMode
        ? "bg-linear-to-br from-emerald-950/40 via-black/30 to-emerald-900/20 backdrop-blur-xl border border-white/10 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/20"
        : "bg-white border border-zinc-200 focus-within:ring-1 focus-within:ring-zinc-300"
    }`}>

      <textarea ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={loading}
        rows={large ? 5 : 1}
        className={`flex-1 bg-transparent border-none outline-none resize-none ${large ? "text-base" : "text-sm"} ${
          darkMode ? "text-white placeholder:text-white/40" : "text-zinc-900 placeholder:text-zinc-400"
        }`} />

      <button
        type="button"
        onClick={() => handleSubmit()}
        disabled={!value.trim() || loading}
        className={`inline-flex items-center justify-center disabled:opacity-40 cursor-pointer rounded-full shrink-0 transition-colors ${
          darkMode
            ? "bg-emerald-500/90 text-black hover:bg-emerald-400"
            : "bg-zinc-950 text-white hover:bg-zinc-800"
        }`}
        style={{
          width: large ? 36 : 24,
          height: large ? 36 : 24,
        }}>
        {loading ? <Loader2Icon size={large ? 20 : 15} className='animate-spin' /> :
          <ArrowRightIcon size={large ? 20 : 15} />}
      </button>
    </div>
  )
}

export default PromptInput