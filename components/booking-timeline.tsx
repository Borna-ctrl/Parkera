"use client";

import { Fragment, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Flag,
  Send,
  SquareParking,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { TimelineStep, TimelineStepState } from "@/lib/bookings/timeline";

const ICONS: Record<string, LucideIcon> = {
  requested: Send,
  approved: CheckCircle2,
  booked: CreditCard,
  active: SquareParking,
  completed: Flag,
};

const NODE_CLASSES: Record<TimelineStepState, string> = {
  done: "bg-primary text-primary-foreground",
  current: "bg-accent text-accent-foreground ring-2 ring-primary",
  upcoming: "bg-muted text-muted-foreground border border-border",
  rejected: "bg-destructive/10 text-destructive",
};

const LABEL_CLASSES: Record<TimelineStepState, string> = {
  done: "text-foreground",
  current: "text-foreground",
  upcoming: "text-muted-foreground",
  rejected: "text-destructive",
};

const LINE_CLASSES: Record<TimelineStepState, string> = {
  done: "bg-primary",
  current: "bg-border",
  upcoming: "bg-border",
  rejected: "bg-border",
};

const DOT_CLASSES: Record<TimelineStepState, string> = {
  done: "bg-primary",
  current: "bg-accent/60",
  upcoming: "bg-muted",
  rejected: "bg-destructive",
};

export function BookingTimeline({
  steps,
  compact = false,
}: {
  steps: TimelineStep[];
  compact?: boolean;
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (compact) {
    const current =
      steps.find((s) => s.state === "current" || s.state === "rejected") ??
      steps[steps.length - 1];
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex gap-1">
          {steps.map((s) => (
            <span
              key={s.key}
              className={`h-1.5 w-5 rounded-full transition-colors duration-300 ${DOT_CLASSES[s.state]}`}
            />
          ))}
        </div>
        <span
          className={`text-xs font-medium ${
            current.state === "rejected" ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {current.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:items-start">
      {steps.map((step, i) => {
        const Icon = step.state === "rejected" ? XCircle : ICONS[step.key];
        const isExpanded = expandedKey === step.key;
        const isLast = i === steps.length - 1;
        return (
          <Fragment key={step.key}>
            <div className="flex flex-1 flex-col md:items-center">
              <button
                type="button"
                onClick={() => setExpandedKey(isExpanded ? null : step.key)}
                className="flex items-start gap-3 text-left md:flex-col md:items-center md:gap-2 md:text-center"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${NODE_CLASSES[step.state]}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className={`text-xs font-medium ${LABEL_CLASSES[step.state]}`}>
                  {step.label}
                </span>
              </button>
              {isExpanded && (
                <p className="ml-11 mt-1 max-w-[14rem] text-xs text-muted-foreground md:ml-0 md:mt-2 md:text-center">
                  {step.description}
                </p>
              )}
            </div>
            {!isLast && (
              <div
                className={`ml-4 h-6 w-px md:ml-0 md:mt-4 md:h-px md:w-full md:flex-1 transition-colors duration-300 ${LINE_CLASSES[step.state]}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
