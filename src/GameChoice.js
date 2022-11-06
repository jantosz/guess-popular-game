import React from "react";
import "./GameChoice.css";

export default function GameChoice(props) {
  return (
    <div className="GameChoice">
      <img src={props.gameBannerUrl} alt={props.gameName} />
      <div className="GameName">{props.gameName}</div>
    </div>
  );
}
