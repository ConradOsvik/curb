import type { ReceiptWithItems } from "@curb/api";
import {
  BoltIcon,
  BuildingStorefrontIcon,
  GlobeAltIcon,
  QuestionMarkCircleIcon,
  ShoppingCartIcon,
  TrashIcon,
  WrenchIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const receiptTypeIcons = {
  online: GlobeAltIcon,
  other: QuestionMarkCircleIcon,
  restaurant: BuildingStorefrontIcon,
  retail: ShoppingCartIcon,
  service: WrenchIcon,
  utility: BoltIcon,
} as const;

const receiptTypeColors = {
  online:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  restaurant:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  retail: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  service:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  utility:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
} as const;

interface ReceiptDetailPanelProps {
  receipt: ReceiptWithItems;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    currency: currency || "USD",
    style: "currency",
  }).format(amount);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  });
}

export function ReceiptDetailPanel({
  receipt,
  onClose,
  onDelete,
}: ReceiptDetailPanelProps) {
  const receiptType = receipt.receiptType as keyof typeof receiptTypeIcons;
  const Icon = receiptTypeIcons[receiptType];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 8);
  }, []);

  const handleDelete = () => {
    onDelete(receipt.id);
    onClose();
  };

  return (
    <motion.div
      key="receipt-detail"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full w-full shrink-0 sm:max-w-md"
    >
      <div className="flex h-full w-full flex-col border-l bg-background">
        <div className="flex flex-col gap-1.5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground">
                {receipt.merchantName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatDate(receipt.date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                  receiptTypeColors[receiptType]
                )}
              >
                {Icon && <Icon className="size-3.5" />}
                <span className="capitalize">{receipt.receiptType}</span>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <XMarkIcon className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4"
          tabIndex={-1}
        >
          {(receipt.merchantAddress ||
            receipt.merchantPhone ||
            receipt.receiptNumber) && (
            <section className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground">
                Merchant Details
              </h3>
              <div className="space-y-1 text-sm">
                {receipt.merchantAddress && (
                  <p className="text-foreground">{receipt.merchantAddress}</p>
                )}
                {receipt.merchantPhone && (
                  <p className="text-muted-foreground">
                    {receipt.merchantPhone}
                  </p>
                )}
                {receipt.receiptNumber && (
                  <p className="text-muted-foreground">
                    Receipt #{receipt.receiptNumber}
                  </p>
                )}
              </div>
            </section>
          )}

          <Separator />

          <section className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground">Items</h3>
            <div className="space-y-2">
              {receipt.items.map((item, index) => (
                <div
                  key={`${item.name}-${item.totalPrice}-${index}`}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    {item.quantity && item.quantity > 1 && (
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}{" "}
                        {item.unitPrice &&
                          `@ ${formatCurrency(item.unitPrice, receipt.currency)}`}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 tabular-nums text-foreground">
                    {formatCurrency(item.totalPrice, receipt.currency)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            {receipt.subtotal !== undefined && receipt.subtotal !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">
                  {formatCurrency(receipt.subtotal, receipt.currency)}
                </span>
              </div>
            )}
            {receipt.tax !== undefined &&
              receipt.tax !== null &&
              receipt.tax > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">
                    {formatCurrency(receipt.tax, receipt.currency)}
                  </span>
                </div>
              )}
            {receipt.tip !== undefined &&
              receipt.tip !== null &&
              receipt.tip > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tip</span>
                  <span className="tabular-nums">
                    {formatCurrency(receipt.tip, receipt.currency)}
                  </span>
                </div>
              )}
            {receipt.fees !== undefined &&
              receipt.fees !== null &&
              receipt.fees > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fees</span>
                  <span className="tabular-nums">
                    {formatCurrency(receipt.fees, receipt.currency)}
                  </span>
                </div>
              )}
            {receipt.discount !== undefined &&
              receipt.discount !== null &&
              receipt.discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="tabular-nums text-green-600">
                    -{formatCurrency(receipt.discount, receipt.currency)}
                  </span>
                </div>
              )}
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Total</span>
              <span className="text-lg font-bold tabular-nums">
                {formatCurrency(receipt.total, receipt.currency)}
              </span>
            </div>
          </section>

          {(receipt.paymentMethod || receipt.cardLastFour) && (
            <>
              <Separator />
              <section className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground">
                  Payment
                </h3>
                <div className="text-sm">
                  {receipt.paymentMethod && (
                    <p className="capitalize text-foreground">
                      {receipt.paymentMethod}
                    </p>
                  )}
                  {receipt.cardLastFour && (
                    <p className="text-muted-foreground">
                      Card ending in {receipt.cardLastFour}
                    </p>
                  )}
                </div>
              </section>
            </>
          )}

          {receipt.imageUrl && (
            <>
              <Separator />
              <section className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground">
                  Receipt Image
                </h3>
                <img
                  src={receipt.imageUrl}
                  alt="Receipt"
                  className="w-full rounded-lg border"
                />
              </section>
            </>
          )}
        </div>

        <div className="relative mt-auto shrink-0">
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-full h-8 bg-linear-to-t from-background/80 to-transparent transition-opacity duration-200",
              isAtBottom ? "opacity-0" : "opacity-100"
            )}
          />
          <div className="border-t p-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full"
            >
              <TrashIcon className="mr-2 size-4" />
              Delete Receipt
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
