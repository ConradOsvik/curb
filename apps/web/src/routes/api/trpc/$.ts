import { appRouter, type Context } from "@curb/api";
import { auth } from "@curb/auth";
import { db } from "@curb/db";
import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

async function createContext(request: Request): Promise<Context> {
  const session = await auth.api.getSession({ headers: request.headers });
  return {
    db,
    user: session?.user
      ? {
          email: session.user.email,
          id: session.user.id,
          image: session.user.image,
          name: session.user.name,
        }
      : null,
  };
}

const handler = ({ request }: { request: Request }) =>
  fetchRequestHandler({
    createContext: () => createContext(request),
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
  });

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});
