const intervals = {
    pitchBD: 1.2,
    yawBD: 1.5,
    pitchRD: 0.2,
    yawRD: 0.2,
};

const randomnessYaw = 0.09;
const randomnessPitch = 0.05;

bot.legitLook = async (position, force = true) => {
    if (!position) return;
    const { pitchBD, yawBD, pitchRD, yawRD } = intervals;
    const rollToCenter = vecToRoll(position.offset(0, bot.entity.onGround ? 1.6 : 1.4, 0), bot);
    const dPitch = rollToCenter.pitch - bot.entity.pitch;
    const changeNeeded = deltaYaw(bot.entity.yaw, bot.entity.yaw + rollToCenter.yaw);
    const pitchChange    =
        position.y - bot.entity.position.y >= 1.3
            ? dPitch / ((pitchBD + Math.random() * pitchRD) * 5) + Math.random() * randomnessPitch
            : dPitch / (pitchBD + Math.random() * pitchRD) + Math.random() * randomnessPitch;
    const yawChange =
        position.y - bot.entity.position.y >= 1.3
            ? -changeNeeded / ((yawBD + Math.random() * yawRD) * 5) + Math.random() * randomnessYaw
            : -changeNeeded / (yawBD + Math.random() * yawRD) + Math.random() * randomnessYaw;
    await bot.look(
        bot.entity.yaw + (yawChange >= 1 ? Math.random() * 0.3 + 0.7 : yawChange),
        bot.entity.pitch + (pitchChange >= 0.3 ? Math.random() * 0.15 + 0.15 : pitchChange),
        force
    );
};
