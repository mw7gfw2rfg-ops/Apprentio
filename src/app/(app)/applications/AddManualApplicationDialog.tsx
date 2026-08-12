"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddManualApplicationDialog({
  addManualApplication,
}: {
  addManualApplication: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Add manually</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add an application manually</DialogTitle>
          <DialogDescription>
            For apprenticeships Apprentio hasn&apos;t indexed yet. AI drafting and AI
            interview prep aren&apos;t available for manual entries — everything else
            (stage tracking, board, marking as submitted) works the same.
          </DialogDescription>
        </DialogHeader>
        <form action={addManualApplication} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-employer-name">Employer</Label>
            <Input id="manual-employer-name" name="employer_name" required placeholder="e.g. BAE Systems" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-role-title">Role title</Label>
            <Input id="manual-role-title" name="role_title" required placeholder="e.g. Cyber Security Degree Apprentice" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-apply-url">Listing URL (optional)</Label>
            <Input id="manual-apply-url" name="apply_url" type="url" placeholder="https://..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-closing-date">Closing date (optional)</Label>
            <Input id="manual-closing-date" name="closing_date" type="date" />
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => setOpen(false)}>
              Add application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
