export function Spinner({ label = 'loading the dex…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20" role="status">
      <div className="h-12 w-12 animate-[spin_1.1s_steps(8)_infinite] rounded-full border-4 border-ink bg-[linear-gradient(#ff9fb0_0_44%,#4a3b4f_44%_56%,#fff6ee_56%_100%)]" />
      <div className="text-2xl text-accent">{label}</div>
    </div>
  );
}
