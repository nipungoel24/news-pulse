const INKS = [
  "#2c4a62",
  "#5a3d32",
  "#2f4a3c",
  "#6a3d36",
  "#4a4e3a",
  "#8a5a2b",
  "#3a3a38",
];

export function clusterInk(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return INKS[hash % INKS.length]!;
}
