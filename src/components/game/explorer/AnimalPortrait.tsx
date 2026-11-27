"use client";

import { useEffect, useRef } from "react";
import { choices, type Character } from "@/lib/explorer-character";
import { drawAnimal } from "./animal-model";
import s from "./CharacterStudio.module.css";

export function AnimalPortrait({ look, turn }: { look: Character; turn: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { kind, shirt, gear } = look;
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || kind === "human") return;
    const image = ctx.createImageData(canvas.width, canvas.height);
    drawAnimal(image.data, canvas.width, kind, choices.shirt[shirt], gear, turn);
    ctx.putImageData(image, 0, 0);
  }, [kind, shirt, gear, turn]);
  return <canvas ref={ref} width={280} height={280} className={s.animal} role="img"
    aria-label={choices.kind[kind] + ", " + shirt + " outfit, " + choices.gear[gear]}/>;
}
