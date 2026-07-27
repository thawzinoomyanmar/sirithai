import { execSync } from "child_process";
try {
  console.log("Running git checkout...");
  const output = execSync("git checkout src/components/TextbookReader.tsx", { encoding: "utf8" });
  console.log("Output:", output);
} catch (e: any) {
  console.error("Error:", e.message || e);
}

