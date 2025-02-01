"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAppStore } from '@/lib/store';

export function InboxSelector() {
  const selectedAccount = useAppStore((state) => state.selectedAccount);
  const inboxes = useAppStore((state) => state.inboxes);
  const setSelectedInbox = useAppStore((state) => state.setSelectedInbox);

  if (!selectedAccount) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select an Inbox</CardTitle>
        <CardDescription>
          Account: {selectedAccount.name}
          <br />
          Choose the inbox where you want to import contacts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inboxes.length === 0 ? (
          <div className="text-center p-8 space-y-4">
            <p className="text-lg font-medium text-muted-foreground">
              No inboxes found
            </p>
            <p className="text-sm text-muted-foreground">
              You need to create at least one inbox in your Conversate AI account before you can import contacts.
            </p>
            <Button
              variant="outline"
              onClick={() => window.open('https://app.conversate.us', '_blank')}
            >
              Go to Conversate AI
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inboxes.map((inbox) => (
              <Button
                key={inbox.id}
                variant="outline"
                className="h-auto p-4 text-left"
                onClick={() => setSelectedInbox(inbox)}
              >
                <div>
                  <div className="font-medium">{inbox.name}</div>
                  <div className="text-sm text-muted-foreground">ID: {inbox.id}</div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}