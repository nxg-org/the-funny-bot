import {Bot} from "mineflayer"
import { CustomLook } from "./classes"

declare module "mineflayer" {
    interface Bot {
        customLook: CustomLook
    }
}

export default function inject(bot: Bot) {
    if (!bot.customLook) bot.customLook = new CustomLook(bot)
}