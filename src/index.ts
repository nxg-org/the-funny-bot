import TWEEN from "@tweenjs/tween.js"
import {Bot} from "mineflayer"
import { CustomLook } from "./lib"

declare module "mineflayer" {
    interface Bot {
        customLook: CustomLook
    }
}

export default function inject(bot: Bot) {
    if (!bot.customLook) bot.customLook = new CustomLook(bot)
    bot.on("physicsTick", () => {
        TWEEN.update()
    })
    
}