import { Entity } from "prismarine-entity";
import { createBot, Bot } from "mineflayer";
import sumoPlugin from "./index";
import { fetchUser } from "./util";

const bot = createBot({
    username: "us",
    host: "localhost",
    version: "1.8.9",
});



const prefix = "!";
bot.on("chat", (username, message) => {
    if (username === bot.entity.username) return;

    let target; // Entity
    let pos; //Vec3

    const msg = message.split(" ");

    switch (msg[0]) {
        case prefix + "testlook":
            target = fetchUser(bot, msg[0], username);
            if (!target) return; // cancel command if cannot find target.


            bot.customLook.lookAt();
    }
});
