import { PokemonList } from '@/features/pokemon-list';

function PokeballLogo() {
  return (
    <div className="relative h-8 w-8 rounded-full border-[3px] border-ink bg-[linear-gradient(#ff9fb0_0_44%,#4a3b4f_44%_56%,#fff6ee_56%_100%)] shadow-[2px_2px_0_#e3b79c]">
      <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-cream" />
    </div>
  );
}

export function App() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b-4 border-ink bg-header px-5 py-3 shadow-[0_4px_0_#e3b79c]">
        <PokeballLogo />
        <div>
          <h1 className="text-3xl leading-none">Pokémon Favorites</h1>
          <p className="text-base leading-tight text-accent">Kanto · first 150</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <PokemonList />
      </main>
    </div>
  );
}
