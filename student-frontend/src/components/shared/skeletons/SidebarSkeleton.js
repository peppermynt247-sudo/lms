const SidebarSkeleton = () => (
  <>
    {/* Mobile toggle placeholder */}
    <div className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-[#ff5b00]/30 rounded-full sk" />

    {/* Full sidebar skeleton — desktop only */}
    <div
      className="w-64 flex-shrink-0 flex-col border-r border-[#1a2b4e]/20 h-full
                 rounded-tr-md rounded-br-md shadow-lg hidden lg:flex"
      style={{ background: "#1a2b4e" }}
    >
      {/* Logo area */}
      <div className="p-6 border-b border-white/10 flex justify-center items-center">
        <div className="h-12 w-28 rounded-lg" style={{ background: "rgba(255,255,255,0.10)" }} />
      </div>

      {/* Nav section label */}
      <div className="px-3 pt-5 pb-3">
        <div className="h-2.5 w-16 rounded" style={{ background: "rgba(255,255,255,0.10)" }} />
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 space-y-1 overflow-hidden">
        {[75, 60, 80, 65, 70, 55].map((w, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <div
              className="h-4 w-4 flex-shrink-0 rounded"
              style={{ background: "rgba(255,255,255,0.12)" }}
            />
            <div
              className="h-3.5 rounded"
              style={{ width: `${w}%`, background: "rgba(255,255,255,0.12)" }}
            />
          </div>
        ))}

        {/* Second section */}
        <div className="px-0 pt-5 pb-2">
          <div className="h-2.5 w-20 rounded" style={{ background: "rgba(255,255,255,0.10)" }} />
        </div>
        {[65, 50].map((w, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <div
              className="h-4 w-4 flex-shrink-0 rounded"
              style={{ background: "rgba(255,255,255,0.12)" }}
            />
            <div
              className="h-3.5 rounded"
              style={{ width: `${w}%`, background: "rgba(255,255,255,0.12)" }}
            />
          </div>
        ))}
      </div>

      {/* User section */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)" }}
            />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 rounded" style={{ background: "rgba(255,255,255,0.15)" }} />
              <div className="h-3 w-14 rounded"   style={{ background: "rgba(255,255,255,0.10)" }} />
            </div>
          </div>
          <div
            className="w-8 h-8 rounded-lg"
            style={{ background: "rgba(255,255,255,0.10)" }}
          />
        </div>
      </div>
    </div>
  </>
)

export default SidebarSkeleton
