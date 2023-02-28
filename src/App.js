import "./App.css";
import Game from "./Game";

function App() {
  return (
    <div className="App">
      <div className="instructions-text">
        Which game has more concurrent players on Steam?
      </div>
      <Game />
    </div>
  );
}

export default App;
