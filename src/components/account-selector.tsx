"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { useAppStore } from "@/lib/store";
import { Account } from "@/lib/api";

export function AccountSelector() {
  const accounts = useAppStore((state) => state.accounts);
  const setSelectedAccount = useAppStore((state) => state.setSelectedAccount);

  // No auto-selection, user must choose an account

  const reset = useAppStore((state) => state.reset);

  const [error, setError] = React.useState<string | null>(null);

  const handleAccountSelect = async (account: Account) => {
    try {
      setError(null);
      await setSelectedAccount(account);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select account");
    }
  };

  const selectedAccount = useAppStore((state) => state.selectedAccount);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Select Account</CardTitle>
          <CardDescription>
            Please select the account where you want to import contacts. You
            have access to {accounts.length} account
            {accounts.length === 1 ? "" : "s"}.
          </CardDescription>
        </div>
        <Button variant="outline" onClick={() => reset()}>
          Logout
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center p-8 space-y-4">
            <p className="text-lg font-medium text-destructive">{error}</p>
            <Button
              variant="outline"
              onClick={() => window.open("https://app.conversate.us", "_blank")}
            >
              Go to Conversate AI
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Button
                key={account.id}
                variant={
                  selectedAccount?.id === account.id ? "default" : "outline"
                }
                className="h-auto p-4 text-left"
                data-testid={`account-${account.id}`}
                aria-label={`Select ${account.name}`}
                onClick={() => handleAccountSelect(account)}
              >
                <div>
                  <div className="font-medium">{account.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ID: {account.id}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
