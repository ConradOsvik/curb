import { v } from "convex/values";

export const folderColorValidator = v.union(
  v.literal("red"),
  v.literal("orange"),
  v.literal("yellow"),
  v.literal("green"),
  v.literal("blue"),
  v.literal("purple"),
  v.literal("pink"),
  v.literal("gray")
);

export type FolderColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "gray";
