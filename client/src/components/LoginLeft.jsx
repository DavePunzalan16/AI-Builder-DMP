import { Sparkles, Check } from 'lucide-react'

const LoginLeft = () => {
  const features = [
    "Describe your idea in plain English",
    "Get a production-ready React site",
    "Publish live in one click",
  ]

  return (
    <div className="hidden lg:flex lg:w-2/5 relative bg-[url('/bgcolor/green-bg.png')] bg-cover bg-center bg-no-repeat flex-col justify-between p-12 shrink-0 select-none overflow-hidden">

      <div className="absolute inset-0 bg-linear-to-b from-black/15 via-black/5 to-black/45 pointer-events-none" />

      <div className="relative flex items-center gap-3.5">
        <img src="/logo.svg" alt="Logo" className="size-11" />
        <span className="text-3xl font-semibold text-white tracking-tight">Ai Builder</span>
      </div>

      <div className="relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/90 text-xs font-medium mb-6">
          <Sparkles size={13} />
          AI-powered site generation
        </div>
      </div>

      <div className="relative">
        <h2 className="text-[36px] text-white font-semibold leading-[1.15] mb-4 tracking-tight">
          Build your presence<br />on the web
        </h2>
        <p className="text-white/75 text-base leading-relaxed mb-7 max-w-sm">
          Describe what you want your website to be about and let Ai Builder do the rest — clean React code, verified layouts, instant deploys.
        </p>

        <ul className="space-y-3 mb-10">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-white/90 text-sm">
              <span className="flex items-center justify-center size-5 rounded-full bg-white/20 shrink-0">
                <Check size={11} strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        <p className="text-white/45 text-xs">
          Copyright {new Date().getFullYear()} Ai Builder. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default LoginLeft