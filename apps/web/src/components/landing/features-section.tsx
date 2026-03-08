import { FolderOpen, Receipt, TrendingUp } from "lucide-react";

const features = [
  {
    description:
      "Take a photo of any receipt and our AI instantly extracts merchant details, line items, and totals.",
    icon: Receipt,
    title: "Scan & Extract",
  },
  {
    description:
      "Create folders, drag and drop receipts, and find what you need with powerful search and filters.",
    icon: FolderOpen,
    title: "Organize",
  },
  {
    description:
      "See your spending patterns at a glance. Track expenses by category, date, and merchant.",
    icon: TrendingUp,
    title: "Track",
  },
] as const;

export function FeaturesSection() {
  return (
    <section className="border-t py-24">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need
          </h2>
          <p className="mt-2 text-muted-foreground">
            A simple workflow for managing all your receipts
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border p-6">
              <feature.icon className="mb-4 size-5 text-muted-foreground" />
              <h3 className="font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
