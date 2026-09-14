import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { submitReport } from "@/lib/reelzy.functions";

type Reason = { value: string; label: string };

/** First screen: why this account is being reported. */
const ACCOUNT_REASONS: Reason[] = [
  { value: "impersonation", label: "Pretending to be someone else" },
  { value: "child_safety", label: "This person may be under 13" },
  { value: "other", label: "Inappropriate profile information" },
  { value: "__more", label: "Something else" },
];

/** Second screen, shown after "Something else". */
const MORE_REASONS: Reason[] = [
  { value: "violence", label: "Violence, abuse and criminal exploitation" },
  { value: "hate", label: "Hate and harassment" },
  { value: "self_harm", label: "Suicide and self-harm" },
  { value: "spam", label: "Scams" },
  { value: "dangerous", label: "Eating disorders and unhealthy body image" },
  { value: "dangerous", label: "Dangerous activities and challenges" },
  { value: "sexual", label: "Nudity or sexual content" },
  { value: "violence", label: "Shocking and graphic content" },
  { value: "misinformation", label: "Misleading information" },
  { value: "spam", label: "Deceptive behaviour and spam" },
  { value: "illegal", label: "Regulated goods and activities" },
  { value: "other", label: "Sharing personal information" },
  { value: "illegal", label: "Counterfeit products and intellectual property" },
  { value: "other", label: "Other" },
];

export function ProfileReportSheet({
  open,
  onOpenChange,
  userId,
  username,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  username: string;
}) {
  const report = useServerFn(submitReport);
  const [step, setStep] = useState<"main" | "more">("main");

  useEffect(() => {
    if (open) setStep("main");
  }, [open]);

  const send = useMutation({
    mutationFn: (r: Reason) =>
      report({
        data: {
          targetType: "user",
          targetId: userId,
          category: r.value,
          details: r.label,
        },
      }),
    onSuccess: () => {
      onOpenChange(false);
      toast.success("Thanks — our safety team will review this account.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = step === "main" ? ACCOUNT_REASONS : MORE_REASONS;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[28px] border-border bg-surface">
        <SheetHeader className="px-0">
          <SheetTitle className="relative text-center font-display text-xl">
            {step === "more" ? (
              <button
                type="button"
                aria-label="Back"
                onClick={() => setStep("main")}
                className="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
              >
                <ChevronLeft className="size-5" />
              </button>
            ) : null}
            Choose a reason
          </SheetTitle>
        </SheetHeader>
        <p className="mb-3 text-center text-xs text-muted-foreground" translate="no" data-no-translate>
          Reporting @{username}
        </p>
        <div className="mb-3 flex items-start gap-2.5 rounded-2xl bg-primary/10 px-4 py-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <p className="text-sm font-medium text-foreground">
            Your report stays anonymous to this person, and we review every report against our rules.
          </p>
        </div>
        <div className="max-h-[55vh] divide-y divide-border overflow-y-auto rounded-2xl bg-surface-raised pb-1">
          {list.map((r) => (
            <button
              key={`${r.value}-${r.label}`}
              type="button"
              disabled={send.isPending}
              onClick={() => (r.value === "__more" ? setStep("more") : send.mutate(r))}
              className="tap-target flex w-full items-center justify-between gap-3 px-4 text-left text-[15px] font-semibold"
            >
              <span>{r.label}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          ))}
        </div>
        <p className="pb-4 pt-3 text-center text-xs text-muted-foreground">
          Reports are reviewed within 24 hours.{" "}
          <Link to="/legal/$doc" params={{ doc: "reporting" }} className="underline">
            Read our report &amp; safety policy
          </Link>
        </p>
      </SheetContent>
    </Sheet>
  );
}
