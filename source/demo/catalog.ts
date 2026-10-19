export const sections = ["Overview", "Components", "Tokens"] as const;
export type Section = (typeof sections)[number];
export const showcaseTasks = [
  {name: "Install dependencies", status: "ready" as const},
  {name: "Compile TypeScript", status: "ready" as const},
  {name: "Publish CLI", status: "running" as const},
];
