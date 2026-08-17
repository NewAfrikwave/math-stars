import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("Times Table Lab narration", () => {
  const source = readFileSync(new URL("../src/components/game/TimesTableView.tsx", import.meta.url), "utf8").replaceAll("\r\n", "\n");

  test("offers a visible read and stop toggle", () => {
    expect(source).toContain("if (speaking) stop()");
    expect(source).toContain('{speaking ? "Stop reading" : "Read aloud"}');
    expect(source).toContain('aria-label={speaking ? "Stop reading the times table"');
  });

  test("stops the previous table before selecting another table", () => {
    const selection = source.slice(source.indexOf("const selectTable"), source.indexOf("const openPractice"));
    expect(selection.indexOf("stop()")).toBeLessThan(selection.indexOf("setSelected(table)"));
  });

  test("stops narration when leaving the lab or opening practice", () => {
    expect(source).toContain("useEffect(() => () => stop(), [stop])");
    expect(source).toContain('onClick={() => { stop(); setView({ name: "home" }); }}');
    expect(source).toContain("const openPractice = () => {\n    stop();");
  });
});
