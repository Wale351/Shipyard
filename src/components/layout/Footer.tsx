export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs leading-none">S</span>
            </div>
            <span className="font-semibold text-zinc-900">Shipyard</span>
          </div>
          <p className="text-sm text-zinc-500 text-center md:text-left">
            Ship your ideas. Discover what others are building.
          </p>
        </div>
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Shipyard. Built with AI.
        </p>
        <div className="flex gap-6 text-sm text-zinc-500">
          <a href="#" className="hover:text-zinc-900 transition-colors">Twitter</a>
          <a href="#" className="hover:text-zinc-900 transition-colors">GitHub</a>
          <a href="#" className="hover:text-zinc-900 transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}
