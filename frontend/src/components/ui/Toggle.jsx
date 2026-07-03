export default function Toggle({ valor, onChange, label }) {
  const knob = (
    <div
      onClick={() => onChange(!valor)}
      className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 shrink-0 cursor-pointer
        ${valor ? 'bg-admin-accent' : 'bg-white/10'}`}
    >
      <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-[left] duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.3)]
        ${valor ? 'left-[21px]' : 'left-[3px]'}`} />
    </div>
  )

  if (!label) return knob

  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      {knob}
      <span className={`text-[13px] ${valor ? 'text-slate-50' : 'text-slate-500'}`}>{label}</span>
    </label>
  )
}
