
export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type LogoPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export interface MarketingStyle {
  id: string;
  name: string;
  description: string;
  promptPrefix: string;
  icon: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  style: string;
  timestamp: number;
}
