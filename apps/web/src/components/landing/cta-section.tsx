import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="border-t py-24">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ready to get organized?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Start tracking your receipts in seconds. No credit card required.
        </p>
        <div className="mt-8">
          <Button size="lg" render={<Link to="/signup" />}>
            Get started for free
          </Button>
        </div>
      </div>
    </section>
  );
}
