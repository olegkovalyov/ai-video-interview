"use client";

import { Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoices } from "@/lib/query/hooks/use-billing";
import type { Invoice } from "@/lib/api/billing";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function InvoiceStatusBadge({ status }: { status: Invoice["status"] }) {
  const variant =
    status === "paid"
      ? "success"
      : status === "open"
        ? "warning"
        : status === "void"
          ? "error"
          : "info";
  return <Badge variant={variant}>{status}</Badge>;
}

export function InvoicesCard({ enabled = true }: { enabled?: boolean }) {
  const { data, isPending, error } = useInvoices(10, enabled);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-foreground">Invoices</h2>
        <p className="text-xs text-muted-foreground">
          Payment history from Stripe (last 10)
        </p>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">
            Unable to load invoices.
          </p>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No invoices yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {data.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {formatAmount(invoice.amountCents, invoice.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.paidAt
                      ? `Paid ${formatDate(invoice.paidAt)}`
                      : `Due ${formatDate(invoice.periodEnd)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <InvoiceStatusBadge status={invoice.status} />
                  {invoice.pdfUrl && (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
