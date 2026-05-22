import {
  TreeDeciduous,
  HandMetal,
  Hammer,
  Droplets,
  Sparkles,
  Leaf,
} from "lucide-react";
import type { CraftProcess } from "@/types/content";

/**
 * Craftsmanship process steps displayed on the homepage.
 * Icons are Lucide component references — rendered by the section component.
 */
export const CRAFT_PROCESSES: CraftProcess[] = [
  {
    icon: TreeDeciduous,
    title: "Wood Selection",
    description:
      "Each timber is hand-selected for its unique grain patterns, density, and character. We source from sustainable forests, choosing only the finest hardwoods that will age beautifully for generations.",
  },
  {
    icon: HandMetal,
    title: "Hand Sanding",
    description:
      "Every surface is meticulously hand-sanded through multiple grit progressions, revealing the wood's natural luster and creating a silk-smooth finish that invites touch.",
  },
  {
    icon: Hammer,
    title: "Traditional Joinery",
    description:
      "We employ centuries-old joinery techniques—mortise and tenon, dovetails, and hand-cut joints—that create bonds stronger than the wood itself, ensuring structural integrity for lifetimes.",
  },
  {
    icon: Droplets,
    title: "Oil Finishing",
    description:
      "Multiple coats of premium linseed oil and beeswax are hand-rubbed into the wood, nourishing the fibers and creating a living finish that develops a rich patina over time.",
  },
  {
    icon: Sparkles,
    title: "Final Detailing",
    description:
      "Every edge is softened, every corner refined. Our artisans spend hours on final touches that transform furniture into functional art, with attention to details both seen and felt.",
  },
  {
    icon: Leaf,
    title: "Quality Assurance",
    description:
      "Each piece undergoes rigorous inspection before leaving our workshop. We stand behind every creation with a lifetime guarantee on craftsmanship and materials.",
  },
];
