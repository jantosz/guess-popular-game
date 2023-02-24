import React from "react";
import "./GameChoice.css";

export default function GameChoice({ gameBannerUrl, gameName }) {
  return (
    <div className="GameChoice">
      <img src={gameBannerUrl} alt={gameName} />
      <div className="GameName">{gameName}</div>
    </div>
  );
}
