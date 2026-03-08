export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Curb</span>
          <span>
            &copy; {new Date().getFullYear()} Curb. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
