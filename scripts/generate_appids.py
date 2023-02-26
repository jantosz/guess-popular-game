import requests
import time
import pickle
import traceback

from pathlib import Path

APPLIST_URL = 'https://raw.githubusercontent.com/dgibbs64/SteamCMD-AppID-List/main/steamcmd_appid.json'
APPDETAILS_URL = 'https://store.steampowered.com/api/appdetails'
CURRENTPLAYERS_URL = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/'

PARTIAL_PLAYERCOUNTS_PATH = Path('script_data/partial_playercounts.dat')
FINAL_APPIDS_PATH = Path('src/appidsList.js')

MAX_RETRIES = 10
RETRY_SLEEP = 3
RATE_LIMIT_SLEEP = 5

NUM_APPS_TO_KEEP = 1000


def load_partial_playercounts() -> tuple[int, dict[int, int]]: # returns index, partial_playercounts
    if PARTIAL_PLAYERCOUNTS_PATH.exists():
        with PARTIAL_PLAYERCOUNTS_PATH.open('rb') as f:
            data = pickle.load(f)
            return data['index'], data['playercounts']
    else:
        return 0, dict()


def save_partial_playercounts(index: int, partial_playercounts: dict[int, int]) -> None:
    with PARTIAL_PLAYERCOUNTS_PATH.open('wb') as f:
        pickle.dump({'index': index, 'playercounts': partial_playercounts}, f)


def save_final_appids(games_to_player_counts: dict[int, int]):
    with FINAL_APPIDS_PATH.open('w') as f:
        f.write('export ALL_APPIDS = new Set([\n')
        for appid in sorted(games_to_player_counts, key=lambda x: -games_to_player_counts[x])[:NUM_APPS_TO_KEEP]:
            f.write(f'{appid},\n')


def is_game(appid: int) -> bool:
    retry_count = 0
    rate_limit_sleep = RATE_LIMIT_SLEEP

    while True:
        resp = requests.get(APPDETAILS_URL, params={'appids': appid})

        if resp.status_code == 200:
            break
        elif resp.status_code == 429:
            print(f'Rate limited on is_game({appid}). Sleeping for {rate_limit_sleep} seconds.')
            time.sleep(rate_limit_sleep)
            rate_limit_sleep *= 2
        else:
            if retry_count == MAX_RETRIES:
                raise MaxRetriesExceeded(f'Checking app {appid}, status code {resp.status_code}', resp.status_code)
            else:
                retry_count += 1
                time.sleep(RETRY_SLEEP)

    resp_data = resp.json()

    return resp_data[str(appid)]['success'] and resp_data[str(appid)]['data']['type'] == 'game'


def concurrent_players(appid: int) -> int:
    retry_count = 0
    rate_limit_sleep = RATE_LIMIT_SLEEP

    while True:
        resp = requests.get(CURRENTPLAYERS_URL, params={'appid': appid})

        if resp.status_code == 200:
            break
        elif resp.status_code == 429:
            print(f'Rate limited on concurrent_players({appid}). Sleeping for {rate_limit_sleep} seconds.')
            time.sleep(rate_limit_sleep)
            rate_limit_sleep *= 2
        elif resp.status_code == 404:
            raise NotFoundError()
        else:
            if retry_count == MAX_RETRIES:
                raise MaxRetriesExceeded(f'Checking players for app {appid}, status code {resp.status_code}', resp.status_code)
            else:
                retry_count += 1
                time.sleep(RETRY_SLEEP)

    return resp.json()['response']['player_count']


class RateLimitedError(Exception):
    pass


class MaxRetriesExceeded(Exception):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(Exception):
    pass


def get_app_list() -> list[int]:
    applist_json = requests.get(APPLIST_URL).json()
    return [content['appid'] for content in applist_json['applist']['apps']]


def main():
    apps = get_app_list()
    print('App list obtained.')

    index, games_to_player_counts = load_partial_playercounts()

    last_percentage = 0

    for i, appid in enumerate(apps[index:]):
        cur_index = index + i

        try:
            app_is_game = is_game(appid)
        except MaxRetriesExceeded as e:
            print(f'Max retries exceeded for is_game({appid}) -- skipping ({e.status_code})')
            continue
        except requests.exceptions.ConnectionError:
            print(f'ConnectionError when trying is_game({appid}) -- skipping')
            continue
        except:
            traceback.print_exc()
            print('Saving partial results to file.')
            save_partial_playercounts(cur_index, games_to_player_counts)
            return

        if app_is_game:
            try:
                player_count = concurrent_players(appid)
            except MaxRetriesExceeded as e:
                print(f'Max retries exceeded for concurrent_players({appid}) -- skipping ({e.status_code})')
                continue
            except requests.exceptions.ConnectionError:
                print(f'ConnectionError when trying concurrent_players({appid}) -- skipping')
                continue
            except NotFoundError:
                print(f'404 when trying concurrent_players({appid}) -- skipping')
                continue
            except:
                traceback.print_exc()
                print('Saving partial results to file.')
                save_partial_playercounts(cur_index, games_to_player_counts)
                return
            
            games_to_player_counts[appid] = player_count

        percentage = int(100 * (cur_index + 1) / len(apps))
        if percentage > last_percentage:
            print(f'{percentage}% complete')
            last_percentage = percentage

    save_final_appids(games_to_player_counts)


if __name__ == '__main__':
    main()
