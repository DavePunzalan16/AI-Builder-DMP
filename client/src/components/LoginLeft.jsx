const LoginLeft = () => {
  return (
    <div className="hidden lg:flex lg:w-2/5 bg-[url('/bg-img.png')] bg-cover bg-center bg-no-repeat flex-col justify-between p-12 shrink-0 select-none">
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="Logo" className="size-9" />
        <span className="text-3xl font-semibold text-white tracking-tight">Ai Builder</span>
      </div>
      <div>
        <h2 className="text-3xl text-white font-semibold leading-snug mb-3 tracking-tight">
          Build your presence on the web
        </h2>
        <p className="text-zinc-200 leading-relaxed">
          Describe what you want your website to be about and let Ai Builder do the rest. React with clean JSX, verified layouts and instant deploys.
        </p>
        <p className="text-zinc-400 text-sm mt-10">
          Copyright {new Date().getFullYear()} Ai Builder. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default LoginLeft