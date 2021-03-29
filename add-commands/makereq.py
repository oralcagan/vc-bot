import sys
import requests
import json

def post_command(body,info):
    headers = {
        "Authorization": "Bot " + info["token"]
    }
    r = requests.post(url=info["api"],json=body,headers=headers)
    return r.status_code

try:
    f = open("commands.json")
except OSError:
    print("Couldn't read commands.json")
    sys.exit(1)

info = json.load(f)

for x in range(len(info["commands"])):
    command = info["commands"][x]
    try:
        scode = post_command(command,info)
        if (scode < 200 or scode > 299):
            print("Status code " + str(scode) + " on command index " + str(x))
    except:
        print("Error on command index " + str(x))