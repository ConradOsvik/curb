import { foldersRouter } from "./routers/folders";
import { receiptsRouter } from "./routers/receipts";
import { storageRouter } from "./routers/storage";
import { router } from "./trpc";

export const appRouter = router({
  folders: foldersRouter,
  receipts: receiptsRouter,
  storage: storageRouter,
});

export type AppRouter = typeof appRouter;
