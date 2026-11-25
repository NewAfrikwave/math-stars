"use client";

import { useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { ToyWorld } from "./game/workshop/ToyWorld";
import styles from "./HomeWorld.module.css";

const challenges = [{ rows: 2, each: 3 }, { rows: 3, each: 2 }, { rows: 3, each: 4 }];

export function HomeOrchard() {
  const [round, setRound] = useState(0);
  const [moves, setMoves] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [solved, setSolved] = useState(false);
  const { rows, each } = challenges[round];
  const counts = Array.from({ length: rows }, (_, basket) => moves.filter(move => move === basket).length);
  const pack = (basket: number) => {
    if (solved) return;
    if (counts[basket] >= 6) { setMessage("This basket is full. Try another basket or undo an apple."); return; }
    setMoves(previous => [...previous, basket]);
    setMessage("");
  };
  const restart = (next: number) => {
    setRound(next); setMoves([]); setSolved(false); setMessage("");
  };
  const check = () => {
    const first = counts.findIndex(count => count !== each);
    if (first >= 0) {
      setMessage(`Basket ${first + 1} has ${counts[first]} apples. It needs ${each}.`);
      return;
    }
    setSolved(true);
    setMessage(`You packed ${rows} equal groups of ${each}. That makes ${rows * each} apples!`);
  };

  return <div className={styles.orchard}>
    <ToyWorld world="orchard" model={{ rows, counts }} onPick={pack} active={!solved} spinKey={0}
      description={counts.map((count, index) => `Basket ${index + 1} has ${count} apples`).join(". ")} />
    <div className={styles.orchardControls}>
      <h3>Put {each} apples in each basket.</h3>
      <p>Tap a basket to add an apple.</p>
      <div className={styles.buttons}>{counts.map((count, index) =>
        <button key={index} disabled={solved} onClick={() => pack(index)} aria-label={`Add an apple to basket ${index + 1}, currently ${count}`}>
          Basket {index + 1} <b>{count}</b>
        </button>)}</div>
      <div className={styles.buttons}>
        {solved ? <button className={styles.inkButton} onClick={() => restart((round + 1) % challenges.length)}>Play another round</button> :
          <button className={styles.inkButton} onClick={check}>Check my baskets</button>}
        <button disabled={!moves.length || solved} onClick={() => { setMoves(moves.slice(0, -1)); setMessage(""); }}><Undo2 size={16}/> Undo</button>
        <button onClick={() => restart(round)} aria-label="Restart orchard"><RotateCcw size={16}/></button>
      </div>
      <p role="status" className={styles.answer}>{message}</p>
    </div>
  </div>;
}
