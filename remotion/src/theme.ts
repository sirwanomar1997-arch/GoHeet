import { loadFont } from "@remotion/google-fonts/Archivo";

export const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "900"],
  subsets: ["latin"],
});

export const COLORS = {
  bg: "#0A0705",
  bgSoft: "#171009",
  ember: "#FF5A1F",
  amber: "#FFA62B",
  cream: "#FFF3E6",
  dim: "rgba(255,243,230,0.62)",
};
