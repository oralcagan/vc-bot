![Logo](https://github.com/oralcagan/vc-bot/blob/main/assets/logo.png)

# Voice Command Bot
This bot is currently in development.So it is basically a worse than average discord bot with voice command feature. It currently can only detect one voice command, which is the "!play" command. I plan to add more commands in the future.

## Usage
After adding your bot to the server, you should be able to use the slash command that comes with it, /favmusic.
You basically provide a youtube video url to the command, then the bot uses the provided url to execute a command.

If the bot isn't already connected to a voice channel you can call the bot to your voice channel by typing in a text chat "!listen". If the bot is already in your channel and you want it to listen to your voice commands, you should type this command to a text chat for it to listen to you.
Note: The user typing "!listen" must have a role named "vc" to use the command.

After the bot starts to listen to you, - it will notify you - you need to tell a catchphrase to the bot for it to treat what you say as a command. You can determine what will be a catchphrase by changing the environment variable in vc-server/initenv.sh . The default is "hey alexa". After you tell the catchphrase, the bot should ping you, telling that it detected a catchprase. After that, you can tell your command. As there is only one command currently, you can tell the bot to play your preferred music by telling it "play my favorite music"

## Contents
contents inside slash/ is made to be run on Cloud Functions. It handles slash commands.
You need to provide environment variables:
- PUBLIC_KEY, public key of your discord app.
- GCLOUD_PROJECT id of your gcloud project.
- BUCKET_NAME name of your gcloud storage bucket.
The bucket must have defaultuser.json and prefpath.json in it.

bot itself is in bot/ , it is typescript code, you can compile it by typing npx tsc inside bot/ directory.

vc-server/ recieves voices of the user from the bot and sends it to wit.ai, edits the command according to the information user provided with slash commands.

add-command/ is a script that sends post requests to Discord API to add the slash commands to the bot.

You can import wit.zip to your wit.ai app.

## A diagram
![Logo](https://github.com/oralcagan/vc-bot/blob/main/assets/diagram.png)