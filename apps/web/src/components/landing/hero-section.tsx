import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:24px_24px] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
      <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-32 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
          Receipt tracking, simplified
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Organize your receipts
          <br />
          <span className="text-muted-foreground">without the hassle</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Snap a photo, let AI extract the details, and keep everything
          organized in folders. Curb makes expense tracking effortless.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button size="lg" render={<Link to="/signup" />}>
            Get started
          </Button>
          <Button size="lg" variant="outline" render={<Link to="/login" />}>
            Sign in
          </Button>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="aspect-video rounded-lg border bg-muted/50" />
        </div>
      </div>
    </section>
  );
}
