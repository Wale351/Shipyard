export function Footer() {
  return (
    <footer className="border-t border-charcoal/5 bg-offwhite py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-charcoal rounded flex items-center justify-center">
              <span className="text-offwhite font-bold text-xs leading-none">S</span>
            </div>
            <span className="font-semibold text-charcoal">Shipyard</span>
          </div>
          <p className="text-sm text-charcoal/40 text-center md:text-left max-w-xs">
            The editorial hub for builders launching the next generation of AI and experimental apps.
          </p>
        </div>
        <p className="text-sm text-charcoal/30">
          © {new Date().getFullYear()} Shipyard. Built with AI.
        </p>
        <div className="flex gap-8 text-sm text-charcoal/40 font-medium">
          <a href="#" className="hover:text-cobalt transition-colors">Twitter</a>
          <a href="#" className="hover:text-cobalt transition-colors">GitHub</a>
          <a href="#" className="hover:text-cobalt transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}
