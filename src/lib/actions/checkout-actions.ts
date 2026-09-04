"use server";
import { OrderCreationPayload } from "@/types/commerce.types";
import { createClient } from "@/lib/supabase/server";
import { isValidBDPhone } from "@/lib/utils";
export async function submitOrderServerAction(payload: OrderCreationPayload) {
  try {
    const { customer, items, subtotal, paymentMethod } = payload;
    if (!customer?.fullName?.trim() || !customer?.phone?.trim() || !customer?.fullAddress?.trim()) {
      return { success: false, message: "গ্রাহকের নাম, মোবাইল নম্বর এবং ঠিকানা আবশ্যক।" };
    }
    if (!isValidBDPhone(customer.phone)) {
      return { success: false, message: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।" };
    }
    if (!items || items.length === 0) return { success: false, message: "কার্ট খালি!" };
    const supabase = await createClient();
    const isFree = subtotal >= 2000;
    const fee = isFree ? 0 : customer.zone === "inside_dhaka" ? 70 : 130;
    const grandTotal = subtotal + fee - (payload.discountAmount || 0);
    const orderNumber = "SS-" + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 90);
    const { data: orderData, error: orderErr } = await supabase.from("orders").insert({
      order_number: orderNumber,
      guest_phone: customer.phone.replace(/\D/g, "").slice(-11),
      guest_name: customer.fullName.trim(),
      shipping_address: customer,
      subtotal,
      delivery_fee: fee,
      discount_amount: payload.discountAmount || 0,
      coupon_code: payload.couponCode || null,
      grand_total: grandTotal,
      payment_method: paymentMethod,
      payment_status: paymentMethod === "cod" ? "unpaid" : "paid",
      order_status: "pending"
    }).select("id, order_number").single();
    if (orderErr || !orderData) return { success: false, message: "ডাটাবেস এরর: " + (orderErr?.message || "") };
    for (const item of items) {
      await supabase.from("order_items").insert({
        order_id: orderData.id,
        product_id: item.productId,
        variant_id: item.variantId,
        product_title: item.titleBn,
        variant_name: item.variantName,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        line_total: item.unitPrice * item.quantity
      });
      await supabase.rpc("decrement_stock", { row_id: item.variantId, qty: item.quantity });
    }
    return { success: true, message: "অর্ডার সফল হয়েছে!", data: { orderNumber: orderData.order_number } };
  } catch (err: any) {
    return { success: false, message: err?.message || "সার্ভার এরর ঘটেছে।" };
  }
}