import { getBrmLevel } from "@/features/organisasi/brm-level";

/** Label level BRM berwarna, mis. "BRM-3". Warnanya sama dengan di bagan organisasi. */
export function BrmLevelBadge({ level }: { level: number }) {
  const brmLevel = getBrmLevel(level);

  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-white"
      style={{ backgroundColor: brmLevel.color }}
    >
      {brmLevel.label}
    </span>
  );
}
