import React, { useState } from "react";
import Header from "./components/Header";
import ControlPanel from "./components/ControlPanel";
import FunFacts from "./components/FunFacts";

export default function App() {
  const [page, setPage] = useState("control"); // "control" | "facts"
  const [activeColor, setActiveColor] = useState(null);
  const [tentacleState, setTentacleState] = useState("resting"); // "resting" | "left" | "right"

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <Header page={page} setPage={setPage} />

      {page === "control" ? (
        <ControlPanel
          activeColor={activeColor}
          setActiveColor={setActiveColor}
          tentacleState={tentacleState}
          setTentacleState={setTentacleState}
        />
      ) : (
        <FunFacts />
      )}
    </div>
  );
}
