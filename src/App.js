import "./App.css";
import GameChoice from "./GameChoice";

function App() {
  return (
    <div className="App">
      <div className="Game">
        <div className="InstructionsText">
          Which game has more concurrent players on Steam?
        </div>
        <GameChoice
          gameName="Don't Starve"
          gameBannerUrl="https://cdn.akamai.steamstatic.com/steam/apps/219740/header.jpg"
        />
        <div className="Divider">OR</div>
        <GameChoice
          gameName="Terraria"
          gameBannerUrl="https://cdn.akamai.steamstatic.com/steam/apps/105600/header.jpg"
        />
      </div>
    </div>
  );
}

export default App;
