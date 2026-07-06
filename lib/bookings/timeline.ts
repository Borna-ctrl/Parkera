import { toISODate } from "@/lib/dates";

export type TimelineStepState = "done" | "current" | "upcoming" | "rejected";

export type TimelineStep = {
  key: string;
  label: string;
  description: string;
  state: TimelineStepState;
};

export type BookingTimelineInput = {
  status: "pending" | "accepted" | "declined" | "cancelled";
  paymentStatus: "none" | "authorized" | "captured" | "paid_out" | "refunded" | "failed";
  startDate: string;
  endDate: string;
  acceptedAt: string | null;
};

const STEP_META = [
  {
    key: "requested",
    label: "Förfrågan",
    description: "Hyresgästen har skickat en bokningsförfrågan. Väntar på svar från uthyraren.",
  },
  {
    key: "approved",
    label: "Godkänd",
    description:
      "Uthyraren har godkänt förfrågan. Betalning måste ske inom 1 timme för att bekräfta bokningen.",
  },
  {
    key: "booked",
    label: "Bokad",
    description:
      "Bokningen är betald och bekräftad. Parkeringen blir tillgänglig från startdatumet.",
  },
  {
    key: "active",
    label: "Aktiv",
    description: "Hyresperioden pågår — parkeringen är tillgänglig nu.",
  },
  {
    key: "completed",
    label: "Avslutad",
    description: "Hyresperioden är avslutad.",
  },
] as const;

function buildSteps(
  currentIndex: number,
  lastIsDone: boolean
): TimelineStep[] {
  return STEP_META.map((meta, i) => ({
    ...meta,
    state:
      i < currentIndex
        ? "done"
        : i === currentIndex
          ? lastIsDone
            ? "done"
            : "current"
          : "upcoming",
  }));
}

export function getBookingTimeline(input: BookingTimelineInput): TimelineStep[] {
  const { status, paymentStatus, startDate, endDate, acceptedAt } = input;
  const paid = paymentStatus === "captured" || paymentStatus === "paid_out";

  if (status === "declined") {
    // Förfrågan (steg 0) skickades och slutfördes — det är godkännandet (steg 1) som nekades.
    const steps = buildSteps(1, false);
    steps[1] = {
      key: "approved",
      label: "Nekad",
      description: "Uthyraren nekade bokningsförfrågan.",
      state: "rejected",
    };
    return steps;
  }

  if (status === "cancelled") {
    const cancelledBeforeAccept = !acceptedAt;
    if (cancelledBeforeAccept) {
      const steps = buildSteps(0, false);
      steps[0] = {
        key: "requested",
        label: "Avbruten",
        description: "Förfrågan avbröts innan uthyraren hann svara.",
        state: "rejected",
      };
      return steps;
    }
    // Godkändes men avbröts innan betalning — steg 0 (förfrågan) räknas som klart.
    const steps = buildSteps(1, false);
    steps[1] = {
      key: "approved",
      label: "Avbruten",
      description: "Bokningen avbröts innan betalning skedde.",
      state: "rejected",
    };
    return steps;
  }

  if (status === "pending") {
    return buildSteps(0, false);
  }

  // status === "accepted"
  if (!paid) {
    return buildSteps(1, false);
  }

  const today = toISODate(new Date());
  if (today < startDate) {
    return buildSteps(2, false);
  }
  if (today <= endDate) {
    return buildSteps(3, false);
  }
  return buildSteps(4, true);
}
