import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { SectionHeading } from "@/components/section";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="container-page py-12">
      <SectionHeading
        title="Your cart"
        blurb="Check the licences you've picked. Prices are confirmed again on the server when you check out."
      />
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
