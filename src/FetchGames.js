const APPDETAILS_URL =
  "https://steam-concurrent-players-proxy.fly.dev/appdetails";
const CURRENTPLAYERS_URL =
  "https://steam-concurrent-players-proxy.fly.dev/currentplayers";

function randomItemFromSet(inputSet) {
  var items = Array.from(inputSet);
  return items[Math.floor(Math.random() * items.length)];
}

export default function fetchNewGame(
  remainingGamesRef,
  setGame,
  setPlayerCount,
  appdetailsCallback = () => {},
  currentplayersCallback = () => {}
) {
  const chosenApp = randomItemFromSet(remainingGamesRef.current);

  remainingGamesRef.current.delete(chosenApp);

  var requestCancelled = false;

  fetch(`${APPDETAILS_URL}?appid=${chosenApp}`).then((resp) => {
    resp.json().then((response) => {
      const respData = response[chosenApp];
      if (response[chosenApp].success) {
        if (!requestCancelled) {
          setGame({
            name: respData.data.name,
            banner: respData.data.header_image,
          });
          appdetailsCallback();
        }
      }
    });
  });

  fetch(`${CURRENTPLAYERS_URL}?appid=${chosenApp}`).then((resp) => {
    resp.json().then((data) => {
      if (resp.ok) {
        setPlayerCount(data.response.player_count);
        currentplayersCallback();
      } else {
        requestCancelled = true;
        setGame({});
        fetchNewGame(
          remainingGamesRef,
          setGame,
          setPlayerCount,
          appdetailsCallback,
          currentplayersCallback
        );
      }
    });
  });
}