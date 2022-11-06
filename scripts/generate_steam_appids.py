#### This will probably take over 9 hours to run.

import requests
import time
import pickle
import os
import traceback

GET_APPLIST_URL = 'https://api.steampowered.com/ISteamApps/GetAppList/v2/'
GET_APPDETAILS_URL = 'https://store.steampowered.com/api/appdetails'
GET_CONCURRENT_PLAYERS_URL = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/'

INTERMEDIATE_FILE_PATH = 'intermediate/generate_appids_intermediate.dat'


def add_game(appid, games):
    get_players_resp = requests.get(GET_CONCURRENT_PLAYERS_URL, params={'appid': appid})
    if get_players_resp.status_code != 200:
        print(f'Error {get_players_resp.status_code} while fetching concurrent players for app {appid}')
        time.sleep(1)
    else:
        games.append((appid, get_players_resp.json()['response']['player_count']))


def main():
    if os.path.exists(INTERMEDIATE_FILE_PATH):
        print('Loading intermediate file.')
        with open(INTERMEDIATE_FILE_PATH, 'rb') as f:
            appids, games, index, errors = pickle.load(f)
    else:
        print('Starting from the beginning.')
        applist_resp = requests.get(GET_APPLIST_URL)

        if applist_resp.status_code != 200:
            print(f'Fetching applist returned code {applist_resp.status_code}')
            return

        appids = [app['appid'] for app in applist_resp.json()['applist']['apps']]

        index = 0
        errors = 0
        games = []

    try:
        for appid in appids[index:]:
            while True:
                appdetails_resp = requests.get(GET_APPDETAILS_URL, params={'appids': appid, 'l': 'en_us'})
                resp_data = appdetails_resp.json()

                if not resp_data:
                    print('Rate limited for appdetails! Waiting a minute.')
                    time.sleep(60)
                else:
                    break

            if str(appid) in resp_data and resp_data[str(appid)]['success']:
                if resp_data[str(appid)]['data']['type'] == 'game' and not resp_data[str(appid)]['data']['release_date']['coming_soon']:
                    add_game(appid, games)
            else:
                print(f'Error getting appdetails for appid {appid}: {resp_data}')
                errors += 1
                time.sleep(1)
            time.sleep(0.1)
            
            index += 1
            if index % 100 == 0:
                print(f'{round(100 * index / len(appids), 2)}% complete')

        games.sort(key=lambda x: -x[1])

        games_string = '\n'.join((str(appid) for appid, _ in games))

        with open('data/gameslist.txt', 'w') as f:
            f.write(games_string)
    except KeyboardInterrupt:
        print(f'Interrupted. Saving intermediate file.')
        with open(INTERMEDIATE_FILE_PATH, 'wb') as f:
            pickle.dump((appids, games, index, errors), f)
        return
    except Exception as e:
        print(f'Failed with {e}:\n{traceback.format_exc(e)}\n\nSAVING INTERMEDIATE FILE.')
        with open(INTERMEDIATE_FILE_PATH, 'wb') as f:
            pickle.dump((appids, games, index, errors), f)
        return
    
    print(f'Finished with {errors} errors.')


if __name__ == '__main__':
    main()
