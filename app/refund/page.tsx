import type { Metadata } from "next";
import PageHero from "../../components/PageHero";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Roun refund policy for Pro and Team purchases.",
};
import Reveal from "../../components/Reveal";

export default function RefundPolicy() {
  return (
    <div className="prose">
      <PageHero kicker="Legal" title={<>Refund <span className="grad-anim">Policy</span></>} sub="How refunds work for Roun subscriptions and credits." />

      <Reveal variant="left">
        <h3>1. Digital services</h3>
        <p>Pro and Team subscriptions are digital services. Once checkout is completed and access is granted, payments are non-refundable unless required by law or the failed dispatch case below.</p>
      </Reveal>
      <Reveal variant="left" delay={60}>
        <h3>2. Failed builds / dispatch errors</h3>
        <p>If a request cannot be dispatched to the cloud builder, held coins are automatically refunded. Disk-side failures that prevent service delivery may also qualify for account credit.</p>
      </Reveal>
      <Reveal variant="left" delay={60}>
        <h3>3. Requests</h3>
        <p>
          To request a review, open <a href="/support">/support</a> with your transaction ID and the reason, or email
          <a href="mailto:Talhamoyelolo52@gmail.com"> Talhamoyelolo52@gmail.com</a>. We review each case and may offer
          credit or a refund where appropriate. Refunds for card payments are issued through Paddle (merchant of
          record) and typically return to your card within 5–10 business days; regional rules of your country may
          give you additional refund rights, which Paddle honors.
        </p>
      </Reveal>
      <Reveal variant="left" delay={60}>
        <h3>4. Chargebacks</h3>
        <p>Chargebacks may lead to account suspension. Contact support first so we can resolve issues before a chargeback is filed.</p>
      </Reveal>
    </div>
  );
}
