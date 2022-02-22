import { createBot } from "mineflayer"
import sumoPlugin from "./index"



const bot = createBot({
    username: "fuck",
    host: "localhost",
    version: "1.8.9"
})


const prefix = "!"
bot.on("chat", (username, message) => {
    const msg = message.split(' ')
    if (username === bot.entity.username) return;


    switch(msg[0]) {
        case prefix + "testlook":
            bot.customLook.lookAt()
    }



})