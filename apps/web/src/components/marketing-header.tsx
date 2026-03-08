import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <span className="text-xs font-bold">C</span>
          </div>
          <span className="font-semibold tracking-tight">Curb</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link to="/login" />}>
            Sign in
          </Button>
          <Button size="sm" render={<Link to="/signup" />}>
            Get started
          </Button>
        </nav>
      </div>
    </header>
  );
}
