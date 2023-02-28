import GameChoice from "./GameChoice";
import "./Game.css";
import { ALL_APPIDS } from "./appidsList";
import { useRef, useState, useEffect } from "react";
import fetchNewGame from "./FetchGames";

function getBest() {
  if (localStorage.getItem("best") === null) {
    return 0;
  } else {
    return parseInt(localStorage.getItem("best"));
  }
}

function storeBest(best) {
  localStorage.setItem("best", best.toString());
}

export default function Game() {
  const remainingGames = useRef(new Set(ALL_APPIDS));
  const [gameData, setGameData] = useState({
    name1: "",
    banner1: "",
    players1: 0,
    name2: "",
    banner2: "",
    players2: 0,
  });
  const game1Ref = useRef({});
  const game2Ref = useRef({});
  const playerCount1Ref = useRef(-1);
  const playerCount2Ref = useRef(-1);

  const score = useRef(0);
  const bestScore = useRef(0);
  const lastChoiceWasCorrect = useRef(true);

  const [gameChosen, setGameChosen] = useState(0);
  const clickedOntoNextRound = useRef(true);

  useEffect(() => {
    bestScore.current = getBest();
    fetchNewGame(
      remainingGames,
      (val) => {
        game1Ref.current = val;
      },
      (val) => {
        playerCount1Ref.current = val;
      },
      checkToRenderNewGames,
      checkToRenderNewGames
    );
    fetchNewGame(
      remainingGames,
      (val) => {
        game2Ref.current = val;
      },
      (val) => {
        playerCount2Ref.current = val;
      },
      checkToRenderNewGames,
      checkToRenderNewGames
    );
  }, []); // only on initial render

  const checkToRenderNewGames = () => {
    if (
      Object.keys(game1Ref.current).length !== 0 &&
      Object.keys(game2Ref.current).length !== 0 &&
      playerCount1Ref.current !== -1 &&
      playerCount2Ref.current !== -1 &&
      clickedOntoNextRound.current
    ) {
      if (!lastChoiceWasCorrect.current) {
        score.current = 0;
      }

      clickedOntoNextRound.current = false;
      document.removeEventListener("mousedown", nextRoundClickCallback);
      setGameData({
        name1: game1Ref.current.name,
        name2: game2Ref.current.name,
        banner1: game1Ref.current.banner,
        banner2: game2Ref.current.banner,
        players1: playerCount1Ref.current,
        players2: playerCount2Ref.current,
      });
      setGameChosen(0);

      game1Ref.current = {};
      game2Ref.current = {};
      playerCount1Ref.current = -1;
      playerCount2Ref.current = -1;
    }
  };

  const nextRoundClickCallback = () => {
    clickedOntoNextRound.current = true;
    checkToRenderNewGames();
  };

  const startLoadingNewGames = () => {
    if (
      (gameChosen === 1 && gameData.players1 < gameData.players2) ||
      (gameChosen === 2 && gameData.players2 < gameData.players1)
    ) {
      remainingGames.current = new Set(ALL_APPIDS);
    }

    fetchNewGame(
      remainingGames,
      (val) => {
        game1Ref.current = val;
      },
      (val) => {
        playerCount1Ref.current = val;
      },
      checkToRenderNewGames,
      checkToRenderNewGames
    );
    fetchNewGame(
      remainingGames,
      (val) => {
        game2Ref.current = val;
      },
      (val) => {
        playerCount2Ref.current = val;
      },
      checkToRenderNewGames,
      checkToRenderNewGames
    );
  };

  const game1ButtonCallback = () => {
    if (gameData.players1 >= gameData.players2) {
      score.current++;
      lastChoiceWasCorrect.current = true;
      if (score.current > bestScore.current) {
        bestScore.current = score.current;
        storeBest(bestScore.current);
      }
    } else {
      lastChoiceWasCorrect.current = false;
    }

    setGameChosen(1);
    startLoadingNewGames();
    document.addEventListener("mousedown", nextRoundClickCallback);
  };

  const game2ButtonCallback = () => {
    if (gameData.players2 >= gameData.players1) {
      score.current++;
      lastChoiceWasCorrect.current = true;
      if (score.current > bestScore.current) {
        bestScore.current = score.current;
        storeBest(bestScore.current);
      }
    } else {
      lastChoiceWasCorrect.current = false;
    }

    setGameChosen(2);
    startLoadingNewGames();
    document.addEventListener("mousedown", nextRoundClickCallback);
  };

  return (
    <div className="Game">
      <GameChoice
        game={{ name: gameData.name1, banner: gameData.banner1 }}
        alreadyClicked={gameChosen !== 0}
        playerCount={gameData.players1}
        hasMorePlayers={gameData.players1 >= gameData.players2}
        buttonClickCallback={game1ButtonCallback}
        writeResultText={gameChosen === 1}
      />
      <div className="divider">
        <div className="divider-line" />
        <div className="divider-line-mask" />
        <div className="divider-text">OR</div>
      </div>
      <GameChoice
        game={{ name: gameData.name2, banner: gameData.banner2 }}
        alreadyClicked={gameChosen !== 0}
        playerCount={gameData.players2}
        hasMorePlayers={gameData.players1 <= gameData.players2}
        buttonClickCallback={game2ButtonCallback}
        writeResultText={gameChosen === 2}
      />
      <div className="scores">
        <div className="current-score">
          SCORE
          <br />
          {score.current}
        </div>
        <div className="best-score">
          BEST
          <br />
          {bestScore.current}
        </div>
      </div>
    </div>
  );
}
