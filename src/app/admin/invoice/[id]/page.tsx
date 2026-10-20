import React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAdminOrderById, getAuthenticatedAdminClient } from "@/lib/actions/admin-order-actions";
import { OrderInvoice } from "@/components/admin/orders/order-invoice";

export const dynamic = "force-dynamic";

interface InvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: InvoicePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `চালান ও প্যাকিং স্লিপ #${id} | Sunnah Source`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminInvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;

  // 1. Guard: Ensure user is authenticated as an admin
  try {
    await getAuthenticatedAdminClient();
  } catch (err: any) {
    redirect("/admin/login?error=unauthorized");
  }

  // 2. Fetch complete order record with items
  const result = await getAdminOrderById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const order = result.data;

  return <OrderInvoice order={order} autoPrint={true} />;
}
