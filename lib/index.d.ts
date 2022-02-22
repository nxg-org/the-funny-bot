import { Bot } from "mineflayer";
declare module "mineflayer" {
    interface Bot {
    }
}
export default function inject(bot: Bot): void;
