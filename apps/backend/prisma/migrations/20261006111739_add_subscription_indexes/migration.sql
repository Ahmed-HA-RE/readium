-- CreateIndex
CREATE INDEX "subscription_referenceId_idx" ON "subscription"("referenceId");

-- CreateIndex
CREATE INDEX "subscription_stripeSubscriptionId_idx" ON "subscription"("stripeSubscriptionId");
