// utils/goatInsights.ts

import Ionicons from "@expo/vector-icons/Ionicons";

export type GoatInsight = {
  section: string;
  title: string;
  message: string;
  tip: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

type RelistedParams = {
  relistCount: number;
  watchers: number;
  bids: number;
};

type AppraisalWatchParams = {
  estimated: number;
  range: { min: number; max: number };
  confidence: string;
};

type AppraisalDiamondParams = {
  rapValue: number;
  carat: number;
  color: string;
  clarity: string;
};

type NoBidsParams = {
  hoursLeft: number;
  bidCount: number;
};

type WatchersParams = {
  watchers: number;
};

export function generateInsight(
  type:
    | "RELISTED"
    | "APPRAISAL_WATCH"
    | "APPRAISAL_DIAMOND"
    | "NO_BIDS"
    | "WATCHERS",
  params:
    | RelistedParams
    | AppraisalWatchParams
    | AppraisalDiamondParams
    | NoBidsParams
    | WatchersParams
): GoatInsight | null {
  switch (type) {
    case "RELISTED": {
      const p = params as RelistedParams;
      return {
        section: "Relisted",
        title: `${p.relistCount}×`,
        message: `This item has been relisted ${p.relistCount} times. It currently has ${p.watchers} watchers and ${p.bids} bids.`,
        tip: "Try refreshing the photos or adjusting the starting price.",
        icon: "refresh",
        color: "#9b59b6",
      };
    }

    case "APPRAISAL_WATCH": {
      const p = params as AppraisalWatchParams;
      return {
        section: "Appraisal",
        title: "Estimated Value",
        message: `Estimated at $${p.estimated}. Range: $${p.range.min}–$${p.range.max}. Confidence: ${p.confidence}.`,
        tip: "Consider setting a reserve price near the lower bound of the range.",
        icon: "analytics",
        color: "#2980b9",
      };
    }

    case "APPRAISAL_DIAMOND": {
      const p = params as AppraisalDiamondParams;
      return {
        section: "Diamond",
        title: `${p.carat}ct ${p.color}/${p.clarity}`,
        message: `Rapaport value: $${p.rapValue}. Color: ${p.color}. Clarity: ${p.clarity}.`,
        tip: "Highlight certification details to increase buyer trust.",
        icon: "diamond",
        color: "#e67e22",
      };
    }

    case "NO_BIDS": {
      const p = params as NoBidsParams;
      return {
        section: "Auction",
        title: "No Bids Yet",
        message: `Only ${p.hoursLeft} hours left and no bids. Current bid count: ${p.bidCount}.`,
        tip: "Try lowering the starting price or improving the first photo.",
        icon: "alert-circle",
        color: "#e74c3c",
      };
    }

    case "WATCHERS": {
      const p = params as WatchersParams;
      return {
        section: "Interest",
        title: `${p.watchers} Watchers`,
        message: `This item has ${p.watchers} watchers.`,
        tip: "Watchers often convert late — consider promoting the listing.",
        icon: "eye",
        color: "#2ecc71",
      };
    }

    default:
      return null;
  }
}
