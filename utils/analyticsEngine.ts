import { Ionicons } from "@expo/vector-icons";

export type GoatInsight = {
  section: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  tip: string;
};

export function generateInsight(event: string, payload: any): GoatInsight | null {
  switch (event) {
    case "LIST_CREATED":
      return {
        section: "[LISTING]",
        color: "#3498db",
        icon: "hammer-outline",
        title: "New Listing Created",
        message: `${payload.name} listed for $${payload.price}.`,
        tip: "Items with 4+ photos get more bids.",
      };

    case "RELISTED":
      if (payload.relistCount >= 2 && payload.bids === 0) {
        return {
          section: "[RELIST]",
          color: "#e74c3c",
          icon: "alert-circle-outline",
          title: "Needs Attention",
          message: "This item has been relisted multiple times.",
          tip: "Lower the price by 5–10% to attract bidders.",
        };
      }
      return {
        section: "[RELIST]",
        color: "#f1c40f",
        icon: "refresh-outline",
        title: "Relisted Item",
        message: "Your item didn’t sell last time.",
        tip: "Try adding 1–2 new photos to boost interest.",
      };

    case "APPRAISAL_WATCH":
      return {
        section: "[APPRAISE]",
        color:
          payload.confidence === "Strong"
            ? "#2ecc71"
            : payload.confidence === "Confident"
            ? "#f1c40f"
            : "#e74c3c",
        icon: "watch-outline",
        title: `Watch Appraisal — ${payload.confidence} Confidence`,
        message: `Estimated value: $${payload.estimated}. Market range: $${payload.range.min}–$${payload.range.max}.`,
        tip:
          payload.confidence === "Strong"
            ? "Great match! Your watch has strong market data."
            : "Add box/papers info to improve accuracy.",
      };

    case "APPRAISAL_DIAMOND":
      return {
        section: "[APPRAISE]",
        color: "#3498db",
        icon: "diamond-outline",
        title: "Diamond Appraisal Complete",
        message: `Rapaport value: $${payload.rapValue}. (${payload.carat}ct ${payload.color}/${payload.clarity})`,
        tip: "Rapaport is wholesale — listing slightly above this helps capture retail buyers.",
      };

    case "NO_BIDS":
      return {
        section: "[GOAT]",
        color: payload.hoursLeft > 24 ? "#3498db" : "#f1c40f",
        icon: "time-outline",
        title: "No Bids Yet",
        message:
          payload.hoursLeft > 24
            ? "Still early — buyers often bid near the end."
            : "Auction ending soon with no bids.",
        tip:
          payload.hoursLeft > 24
            ? "Share your listing to increase visibility."
            : "Consider lowering the starting price next time.",
      };

    case "WATCHERS":
      return {
        section: "[GOAT]",
        color: payload.watchers > 0 ? "#2ecc71" : "#f1c40f",
        icon: payload.watchers > 0 ? "eye-outline" : "eye-off-outline",
        title: payload.watchers > 0 ? "Strong Interest" : "Low Visibility",
        message:
          payload.watchers > 0
            ? `${payload.watchers} buyers are watching your item.`
            : "No watchers yet.",
        tip:
          payload.watchers > 0
            ? "Watchers often turn into bidders — keep your price steady."
            : "Add more tags to help buyers find your item.",
      };

    default:
      return null;
  }
}
