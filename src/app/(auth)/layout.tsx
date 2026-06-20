import { Boxes, Package, ShoppingCart, BarChart3 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] bg-[#f4f6fb]">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] flex-col bg-[#0e1117] relative overflow-hidden">
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow orb */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/40">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">ICL Inventory</span>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
            Inventory Management
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
            Full control of<br />your stock,<br />
            <span className="text-indigo-400">every single day.</span>
          </h1>
          <p className="mt-5 text-sm text-white/40 leading-relaxed max-w-xs">
            Track purchases, issues, returns, and opening stock. Know exactly what moves in and out.
          </p>

          {/* Feature bullets */}
          <div className="mt-10 space-y-3">
            {[
              { icon: Package, label: "Real-time stock tracking" },
              { icon: ShoppingCart, label: "Purchase & issue management" },
              { icon: BarChart3, label: "Stock history & composition" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <Icon className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <span className="text-sm text-white/50">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 p-10">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} ICL. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  );
}
