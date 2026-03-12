import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./router";

export { appRouter, type AppRouter } from "./router";
export type { Context } from "./trpc";
export type { FolderColor } from "./validators";

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;

export type Folder = RouterOutput["folders"]["listAll"][number];
export type ReceiptWithItems = NonNullable<RouterOutput["receipts"]["get"]>;
export type ReceiptItem = ReceiptWithItems["items"][number];
