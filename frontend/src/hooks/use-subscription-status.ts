"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { BillingAccessStatus, BillingStatusResponse } from "@/lib/billing-status";

type UseSubscriptionStatusResult = {
  data: BillingStatusResponse | null;
  status: BillingAccessStatus;
  isLoading: boolean;
  error: string | null;
};

export function useSubscriptionStatus() : UseSubscriptionStatusResult {
  const { getToken } = useAuth();
  const [data, setData] = useState<BillingStatusResponse | null>(null);
  const [status, setStatus] = useState<BillingAccessStatus>("inactive");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!backendUrl) {
          throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
        }

        const token = await getToken();
        if (!token) {
          if (!cancelled) {
            setStatus("inactive");
            setData(null);
            setIsLoading(false);
          }
          return;
        }

        const response = await fetch(`${backendUrl}/api/billing/subscription-status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Subscription status request failed (${response.status})`);
        }

        const json = (await response.json()) as BillingStatusResponse;
        if (!cancelled) {
          setData(json);
          setStatus(json.status);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown status error");
          setStatus("inactive");
          setData(null);
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [getToken]);

  return { data, status, isLoading, error };
}
