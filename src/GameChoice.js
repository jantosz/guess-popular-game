import React from "react";
import "./GameChoice.css";

function integerToStringWithCommas(number) {
  const numString = number.toString();
  var outputString = "";

  for (var i = 0; i < numString.length; i++) {
    const stringIndex = numString.length - 1 - i;
    if (i !== 0 && i % 3 === 0) {
      outputString = "," + outputString;
    }
    outputString = numString[stringIndex] + outputString;
  }

  return outputString;
}

export default function GameChoice({
  game,
  alreadyClicked,
  playerCount,
  buttonClickCallback,
  hasMorePlayers,
  writeResultText,
}) {
  return (
    <div className="GameChoice">
      {!alreadyClicked && (
        <button
          className={"game-choice-button"}
          onClick={buttonClickCallback}
        />
      )}
      <div className="game-choice-visible-items">
        <div className={alreadyClicked ? "player-count-overlay" : ""}>
          <div className={alreadyClicked ? "player-count-text" : ""}>
            {alreadyClicked ? integerToStringWithCommas(playerCount) : ""}
          </div>
          {alreadyClicked && writeResultText && hasMorePlayers && (
            <div className="correct-text">Correct! Click to continue...</div>
          )}
          {alreadyClicked && writeResultText && !hasMorePlayers && (
            <div className="incorrect-text">Incorrect. Click to restart...</div>
          )}
        </div>
        <img src={game.banner} alt={game.name} />
        <div className="game-name">{game.name}</div>
      </div>
    </div>
  );
}
