import { Entity } from "prismarine-entity";
import { createBot, Bot } from "mineflayer";
import sumoPlugin from "./index";
import { cheapPredictVelocity, entityCheck, fetchUser, getLatencyInTicks } from "./util";
import utilPlugin, { AABBUtils, MathUtils } from "@nxg-org/mineflayer-util-plugin";
import tracker from "@nxg-org/mineflayer-tracker";

//setup.
const bot = createBot({
    username: "fuck",
    host: "SMEDcccccccc.aternos.me",
    version: "1.8.9",
});
bot.loadPlugin(sumoPlugin);
bot.loadPlugin(utilPlugin);
bot.loadPlugin(tracker);

//variables.
const prefix = "!";
let testLookFollowLoop = false;
let fightingLoop = false;

//handlers.
bot.on("spawn", async () => {});
bot.on("chat", async (username, message) => {
    if (username === bot.entity.username) return;

    let target; // Entity

    const msg = message.split(" ");

    target = fetchUser(bot, msg[0], username);
    switch (msg[0]) {
        case prefix + "testlook":
            if (!target) return bot.chat("No player found."); // cancel command if cannot find target.

            //reset.
            await resetLoops();
            lookAtLoop(bot, target);
            break;

        case prefix + "allstop":
            testLookFollowLoop = false;
            fightingLoop = false;
            break;

        case prefix + "lookstop":
            testLookFollowLoop = false;
            break;

        case prefix + "fight":
            if (!target) return bot.chat("No player found.");

            await resetLoops();
            lookAtLoop(bot, target);
            await bot.util.sleep(0);

            // bot.setControlState("left", true)
            let i = 0;
            let wasTooFar = false;
            while (fightingLoop) {
                bot.setControlState("forward", true);
                bot.setControlState("sprint", true);
                const scale = getLatencyInTicks(bot);
                const scaledVel = bot.entity.velocity.scaled(scale);
                if (entityCheck(bot, 3, { enabled: true, scale })) {
                    console.log("attacking");
                    if (i % 3 === 0) {
                        bot.attack(target);
                        bot.setControlState("sprint", false);
                        i = 0;
                    }
                } else {
                    const eyePos = bot.entity.position.offset(0, bot.entity.height, 0);
                    const eyeDir = MathUtils.yawPitchAndSpeedToDir(bot.entity.yaw, bot.entity.pitch, 1).normalize();
                    const targetBB = AABBUtils.getEntityAABB(target).offset(scaledVel.x, scaledVel.y, scaledVel.z);
                    const tooFar = targetBB.distanceToVec(eyePos) > 3.5;
                    const notLookingAt = !targetBB.intersectsRay(eyePos, eyeDir);
                    console.log(tooFar ? "too far away.   " : "close enough.   ", !notLookingAt ? "no intersection." : "can hit entity.");
                    if (!tooFar && notLookingAt) i = -1;
                    if (wasTooFar && !tooFar) i = -1;
                    wasTooFar = tooFar;

                    // bot.swingArm("right");
                }

                i++;
                await bot.waitForTicks(1);
            }

            // bot.tracker.stopTrackingEntity(target, true)
            break;

        case prefix + "hunt":
            await resetLoops();
            await bot.util.sleep(0);

            // bot.setControlState("left", true)
            let i1 = 0;
            let wasTooFar1 = false;
            while (fightingLoop) {
                target = bot.nearestEntity((e) => e.type === "player");
                if (!target) return await bot.waitForTicks(1);
                bot.setControlState("forward", true);
                bot.setControlState("sprint", true);
                const scale = getLatencyInTicks(bot) + 1;
                const scaledVel = bot.entity.velocity.scaled(scale);
                bot.customLook.lookAt(
                    target.position.plus(cheapPredictVelocity(bot, target, scale)).translate(0, target.height * 2/3, 0),
                    0,
                    true
                );
                if (entityCheck(bot, 3, { enabled: true, scale })) {
                    console.log("attacking");
                    if (i1 % 3 === 0) {
                        bot.attack(target);
                        bot.setControlState("sprint", false);
                        i1 = 0;
                    }
                } else {
                    const eyePos = bot.entity.position.offset(0, bot.entity.height, 0);
                    const eyeDir = MathUtils.yawPitchAndSpeedToDir(bot.entity.yaw, bot.entity.pitch, 1).normalize();
                    const targetBB = AABBUtils.getEntityAABB(target).offset(scaledVel.x, scaledVel.y, scaledVel.z);
                    const tooFar = targetBB.distanceToVec(eyePos) > 3.5;
                    const notLookingAt = !targetBB.intersectsRay(eyePos, eyeDir);
                    console.log(tooFar ? "too far away.   " : "close enough.   ", !notLookingAt ? "no intersection." : "can hit entity.");
                    if (!tooFar && notLookingAt) i1 = -1;
                    // if (wasTooFar1 && !tooFar) i1 = -1;
                    wasTooFar1 = tooFar;

                    // bot.swingArm("right");
                }

                i1++;
                await bot.waitForTicks(1);
            }

            // bot.tracker.stopTrackingEntity(target, true)
            break;
    }
});

//functions.
async function resetLoops() {
    testLookFollowLoop = false;
    fightingLoop = false;
    await bot.waitForTicks(2);
    testLookFollowLoop = true;
    fightingLoop = true;
}

async function lookAtLoop(bot: Bot, entity: Entity) {
    while (testLookFollowLoop) {
        //.plus(entity.velocity).translate(0, entity.height, 0)
        //.offset(0, entity.height, 0)
        const scale = getLatencyInTicks(bot);
        bot.customLook.lookAt(entity.position.plus(cheapPredictVelocity(bot, entity, scale)).translate(0, entity.height * 0.66, 0), 0, true);
        await bot.waitForTicks(1);
    }
}
