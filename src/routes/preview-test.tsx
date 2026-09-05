import { createFileRoute } from "@tanstack/react-router";
import { AvatarPreview } from "@/components/reelzy/avatar-preview";
const base = {
  gender: "Female", age: "20s", skin: "Light olive", face: "Oval", eyeColor: "Blue",
  eyeShape: "Almond", brows: "Soft arched", nose: "Straight", lips: "Full", ears: "Medium",
  hair: "Long wavy", hairColor: "Chestnut", facialHair: "Clean shaven", expression: "Warm half-smile",
  outfit: "Crewneck sweater", outfitColor: "Dusty pink", fabric: "Soft knit", headwear: "None",
  eyewear: "None", makeup: ["Warm blush"], jewelry: ["Hoop earrings"], background: "Warm orange-pink glow", extras: [],
};
const male = { ...base, gender: "Male", hair: "Short swept-back", facialHair: "Short beard", outfit: "Crisp white shirt", outfitColor: "White", lips: "Medium", makeup: [], jewelry: [] };
export const Route = createFileRoute("/preview-test")({ ssr: false, component: () => (
  <div className="grid grid-cols-2 gap-2 p-2">
    <AvatarPreview t={base} className="w-full" />
    <AvatarPreview t={male} className="w-full" />
    <AvatarPreview t={{ ...male, hair: "Curly afro", skin: "Deep brown", eyewear: "Bold square frames", headwear: "Cap", outfitColor: "Crimson" }} className="w-full" />
    <AvatarPreview t={{ ...base, hair: "Braids", skin: "Warm brown", headwear: "Beanie", expression: "Big joyful grin", background: "Violet twilight" }} className="w-full" />
  </div>
) });
