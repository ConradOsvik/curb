import { billingRouter } from "./routers/billing";
import { foldersRouter } from "./routers/folders";
import { receiptsRouter } from "./routers/receipts";
import { sheetsRouter } from "./routers/sheets";
import { storageRouter } from "./routers/storage";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
  billing: billingRouter,
  folders: foldersRouter,
  receipts: receiptsRouter,
  sheets: sheetsRouter,
  storage: storageRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
