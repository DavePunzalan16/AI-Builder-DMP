import { BotIcon, BotMessageSquareIcon, UserIcon } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import PromptInput from './PromptInput'

const ChatPanel = ({ messages, onSend, loading, darkMode }) => {

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" })
  }, [messages, loading])

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${darkMode ? "bg-transparent" : "bg-white"}`}>
      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-3 space-y-3 hide-scrollbar'>
        {messages.length === 0 && (
          <div className='flex items-center justify-center h-full'>
            <p className={`text-sm text-center ${darkMode ? "text-white/40" : "text-zinc-400"}`}>
              Ask Ai to Modify your Website or your code
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div className='flex gap-2.5 items-start'>
              <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 ${
                darkMode ? "bg-white/10" : "bg-zinc-50"
              }`}>
                {msg.role === "user" ? (
                  <UserIcon size={14} className={darkMode ? "text-white/60" : "text-zinc-500"} />
                ) : (
                  <BotMessageSquareIcon size={14} className={darkMode ? "text-white/80" : "text-zinc-700"} />
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <p className={`text-xs font-medium mb-1 uppercase tracking-wider ${
                  darkMode ? "text-white/40" : "text-zinc-500"
                }`}>
                  {msg.role === "user" ? "You" : "AI"}
                </p>
                <p className={`text-[13px] leading-relaxed tracking-wider whitespace-pre-wrap wrap-break-word ${
                  darkMode ? "text-white/80" : "text-zinc-700"
                }`}>
                  {msg.content.split("- '/").map((text, j) => (
                    <span key={j} className='block mt-3'>
                      <span className={j === 0 ? "hidden" : ""}>- '/</span>
                      {text}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className='flex gap-2.5 items-start'>
            <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 ${
              darkMode ? "bg-white/10" : "bg-zinc-900/5"
            }`}>
              <BotIcon size={13} className={darkMode ? "text-white/80" : "text-zinc-900"} />
            </div>
            <div className='flex-1'>
              <p className={`text-[11px] font-medium mb-2 uppercase tracking-wider ${
                darkMode ? "text-white/40" : "text-zinc-400"
              }`}>
                AI
              </p>
              <div className='dot-loader'>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <div className={`p-3 border-t transition-colors duration-300 ${darkMode ? "border-white/10" : "border-zinc-200"}`}>
        <PromptInput onSubmit={onSend} loading={loading} placeholder='Ask Ai to Modify....' autoFocus darkMode={darkMode} />
      </div>
    </div>
  )
}

export default ChatPanel