"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  Coins,
  ExternalLink,
  Download,
  ChevronDown,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface InvoiceData {
  id: string;
  number: string | null;
  status: string | null;
  amountPaid: number;
  currency: string;
  created: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

export interface TokenPurchaseData {
  id: string;
  packType: string;
  creditsAdded: number;
  amountPaid: number;
  createdAt: string;
}

interface BillingHistoryProps {
  invoices: InvoiceData[];
  tokenPurchases: TokenPurchaseData[];
}

function formatCurrency(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function formatDate(dateOrTimestamp: string | number): string {
  const date =
    typeof dateOrTimestamp === "number"
      ? new Date(dateOrTimestamp * 1000)
      : new Date(dateOrTimestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadgeVariant(status: string | null) {
  switch (status) {
    case "paid":
      return "success" as const;
    case "open":
      return "warning" as const;
    case "void":
    case "uncollectible":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function packLabel(packType: string): string {
  const match = packType.match(/PACK_(\d+)/);
  return match ? `${match[1]} Images` : packType;
}

const INITIAL_DISPLAY = 10;

export function BillingHistory({
  invoices,
  tokenPurchases,
}: BillingHistoryProps) {
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [showAllPurchases, setShowAllPurchases] = useState(false);

  const displayedInvoices = showAllInvoices
    ? invoices
    : invoices.slice(0, INITIAL_DISPLAY);
  const displayedPurchases = showAllPurchases
    ? tokenPurchases
    : tokenPurchases.slice(0, INITIAL_DISPLAY);

  return (
    <div>
      <h3 className="text-foreground text-base font-semibold">
        Billing History
      </h3>
      <p className="text-muted-foreground/60 mt-1 text-sm">
        View your past invoices and image pack purchases
      </p>

      <div className="mt-5">
        <Tabs defaultValue="invoices">
          <TabsList className="mb-5">
            <TabsTrigger value="invoices" className="text-xs">
              Invoices
            </TabsTrigger>
            <TabsTrigger value="purchases" className="text-xs">
              Purchases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            {invoices.length === 0 ? (
              <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
                <Receipt className="text-muted-foreground/30 mb-2 h-5 w-5" />
                <p className="text-muted-foreground/60 text-sm">
                  No invoices yet
                </p>
                <p className="text-muted-foreground/30 mt-0.5 text-xs">
                  Invoices appear here when you subscribe to a paid plan.
                </p>
              </div>
            ) : (
              <div className="border-border rounded-xl border">
                {/* Header */}
                <div className="border-border bg-muted/50 text-muted-foreground/60 hidden border-b px-4 py-2 text-[10px] font-medium tracking-wider uppercase sm:flex">
                  <div className="flex-1">Invoice</div>
                  <div className="w-24 text-right">Amount</div>
                  <div className="w-20 text-center">Status</div>
                  <div className="w-24 text-right">Actions</div>
                </div>

                {displayedInvoices.map((invoice, i) => (
                  <div
                    key={invoice.id}
                    className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-0 ${
                      i < displayedInvoices.length - 1
                        ? "border-border border-b"
                        : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground text-sm font-medium">
                        {invoice.number || invoice.id.slice(0, 20)}
                      </div>
                      <div className="text-muted-foreground/60 text-[11px]">
                        {formatDate(invoice.created)}
                      </div>
                    </div>
                    <div className="text-foreground w-24 text-left text-sm font-medium tabular-nums sm:text-right">
                      {formatCurrency(invoice.amountPaid, invoice.currency)}
                    </div>
                    <div className="w-20 sm:text-center">
                      <Badge variant={statusBadgeVariant(invoice.status)}>
                        {invoice.status || "unknown"}
                      </Badge>
                    </div>
                    <div className="flex w-24 gap-1 sm:justify-end">
                      {invoice.hostedInvoiceUrl && (
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground/60 hover:text-muted-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      )}
                      {invoice.invoicePdf && (
                        <a
                          href={invoice.invoicePdf}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground/60 hover:text-muted-foreground"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {invoices.length > INITIAL_DISPLAY && !showAllInvoices && (
                  <button
                    onClick={() => setShowAllInvoices(true)}
                    className="border-border text-primary hover:text-primary/85 flex w-full items-center justify-center gap-1 border-t py-2.5 text-xs font-medium transition-colors"
                  >
                    Show all {invoices.length} invoices
                    <ChevronDown className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchases">
            {tokenPurchases.length === 0 ? (
              <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
                <Coins className="text-muted-foreground/30 mb-2 h-5 w-5" />
                <p className="text-muted-foreground/60 text-sm">
                  No purchases yet
                </p>
                <p className="text-muted-foreground/30 mt-0.5 text-xs">
                  Buy extra image generations above to get more credits.
                </p>
              </div>
            ) : (
              <div className="border-border rounded-xl border">
                {/* Header */}
                <div className="border-border bg-muted/50 text-muted-foreground/60 hidden border-b px-4 py-2 text-[10px] font-medium tracking-wider uppercase sm:flex">
                  <div className="flex-1">Pack</div>
                  <div className="w-20 text-center">Credits</div>
                  <div className="w-20 text-right">Amount</div>
                  <div className="w-24 text-right">Date</div>
                </div>

                {displayedPurchases.map((purchase, i) => (
                  <div
                    key={purchase.id}
                    className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-0 ${
                      i < displayedPurchases.length - 1
                        ? "border-border border-b"
                        : ""
                    }`}
                  >
                    <div className="text-foreground flex-1 text-sm font-medium">
                      {packLabel(purchase.packType)}
                    </div>
                    <div className="w-20 sm:text-center">
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px]"
                      >
                        +{purchase.creditsAdded}
                      </Badge>
                    </div>
                    <div className="text-foreground w-20 text-left text-sm font-medium tabular-nums sm:text-right">
                      {formatCurrency(purchase.amountPaid)}
                    </div>
                    <div className="text-muted-foreground/60 w-24 text-left text-[11px] sm:text-right">
                      {formatDate(purchase.createdAt)}
                    </div>
                  </div>
                ))}

                {tokenPurchases.length > INITIAL_DISPLAY &&
                  !showAllPurchases && (
                    <button
                      onClick={() => setShowAllPurchases(true)}
                      className="border-border text-primary hover:text-primary/85 flex w-full items-center justify-center gap-1 border-t py-2.5 text-xs font-medium transition-colors"
                    >
                      Show all {tokenPurchases.length} purchases
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
