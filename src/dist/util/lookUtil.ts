import { Bot } from "mineflayer";
import { AABB, AABBUtils, MathUtils } from "@nxg-org/mineflayer-util-plugin";
import * as THREE from "three";
import { Vec3 } from "vec3";
import { Entity } from "prismarine-entity";
import { Block } from "prismarine-block";



export function fetchUser(bot: Bot, name: string, authorName: string) {
    return bot.nearestEntity((e) => e.username === name ?? e.name === name) ?? bot.nearestEntity((e) => e.username === authorName);
}

export function getLatencyInTicks(bot: Bot) {
    return Math.ceil(bot.player.ping / 50); // Math.ceil(bot._client.latency / 50);
}


export function lookingAtEuler(yaw: number, pitch: number) {
    return new THREE.Euler(yaw, pitch, 0);
}

export function targetEuler(src: Vec3, dest: Vec3) {
    const dir = dest.minus(src);
    return dirToEuler(dir);
}

export function dirToEuler(dir: Vec3) {
    const yaw = Math.atan2(-dir.x, -dir.z);
    const groundDistance = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
    const pitch = Math.atan2(dir.y, groundDistance);
    return new THREE.Euler(yaw, pitch, 0);

}

export function cheapPredictVelocity(bot: Bot, target: Entity, scale?: number, customVel?: Vec3) {
    let vel = customVel// ?? bot.tracker.getEntitySpeed(target);
    if (!vel) vel = target.velocity
    if (scale && scale !== 1) vel = vel.scaled(scale)
    return vel
}

type RaycastReturn = Block & {face: number, intersect: Vec3 } //{block: Block | null, iterations: {x: number, y: number, z: number, face: number}};
type CheckingExtras = {enabled: boolean, velocity?: Vec3, scale?: number}
export function entityCheck(bot: Bot, maxDistance: number = 3.5, extras: CheckingExtras = {enabled: false}) {
    const eyePos = bot.entity.position.offset(0, bot.entity.height, 0);

    const possibleEntities: Entity[] = Object.values(bot.entities)
        .filter((e) => e !== bot.entity && e.position.distanceTo(eyePos) < maxDistance + 3); //arbitrary value, can use true distance for faster calc.
    if (possibleEntities.length === 0) return null;

    
    const possibleAABBs: [entity: Entity, bb: AABB][] = possibleEntities.map((e) => [e, AABBUtils.getEntityAABB(e)]);
    if (extras.enabled) {
        possibleAABBs.forEach(obj => {
            const e = obj[0]
            let vel = cheapPredictVelocity(bot, e, extras.scale)
            obj[1].offset(vel.x, vel.y, vel.z)
        })
    }
    //const dir = MathUtils.yawPitchAndSpeedToDir(bot.entity.yaw, bot.entity.pitch, distance); //vector that bot can reach
    const dir = MathUtils.yawPitchAndSpeedToDir(bot.entity.yaw, bot.entity.pitch, 1).normalize(); // normalized vector

    const intersections: [entity: Entity, intersect: Vec3][] = possibleAABBs
        .map((obj) => [obj[0], obj[1].intersectsRay(eyePos, dir)])
        .filter((obj) => obj[1] !== null)
        .filter(obj => (obj[1] as Vec3).distanceTo(eyePos) < maxDistance ) as [entity: Entity, intersect: Vec3][]

    if (intersections.length === 0) return null;

    const sorted = intersections.sort((a, b) => a[1].distanceTo(eyePos) - b[1].distanceTo(eyePos));
    const closestIntersect = sorted[0];

    const blockIntersect: RaycastReturn = bot.world.raycast(eyePos, dir, maxDistance, null);

    const flag = blockIntersect ? eyePos.distanceTo(blockIntersect.intersect) < eyePos.distanceTo(closestIntersect[1]) : false
   
    return flag ? null : closestIntersect[0];
}

export function getBetweenRectangle(src: AABB, dest: AABB) {
    const outerAABB = new AABB(
        Math.min(src.minX, dest.minX),
        Math.min(src.minY, dest.minY),
        Math.min(src.minZ, dest.minZ),
        Math.max(src.maxX, dest.maxX),
        Math.max(src.maxY, dest.maxY),
        Math.max(src.maxZ, dest.maxZ)
    );

    //Math.max() only good for length, otherwise leave because we want good shit.
    const innerAABBWidth = outerAABB.maxX - outerAABB.minX - (src.maxX - src.minX) - (dest.maxX - dest.minX);
    const innerAABBLength = outerAABB.maxZ - outerAABB.minZ - (src.maxZ - src.minZ) - (dest.maxZ - dest.minZ);
    const innerAABBHeight = outerAABB.maxY - outerAABB.minY - (src.maxY - src.minY) - (dest.maxY - dest.minY);

    //hm... could make a new AABB representing inner here.
    const outerCenter = outerAABB.getCenter();
    const wFlip = Math.sign(innerAABBWidth);
    const hFlip = Math.sign(innerAABBHeight);
    const lFlip = Math.sign(innerAABBLength);
    const innerAABB = new AABB(
        outerCenter.x - (wFlip * innerAABBWidth) / 2,
        outerCenter.y - (hFlip * innerAABBHeight) / 2,
        outerCenter.z - (lFlip * innerAABBLength) / 2,
        outerCenter.x + (wFlip * innerAABBWidth) / 2,
        outerCenter.y + (hFlip * innerAABBHeight) / 2,
        outerCenter.z + (lFlip * innerAABBLength) / 2
    );
    // const length = Math.sqrt(Math.max(0, innerAABBHeight) ** 2 + Math.max(0, innerAABBLength) ** 2 + Math.max(0, innerAABBWidth) ** 2);

    return innerAABB;
}

function lerp(v0: number, v1: number, t: number) {
    return v0*(1-t)+v1*t
}

/**
 * this is early. I already know I can do much better than this. We'll see how it goes though.
 * more importantly, this assumes that your direction is already hitting the destination.
 */
export function getIdealAimPosition(src: Vec3, dir: Vec3, destBB: AABB) {
    const oldIntercept = destBB.intersectsRay(src, dir)
    if (!oldIntercept) throw "doesn't hit."


    //check if we can look straight forward.
    const noY = dir.offset(0, -dir.y, 0)
    if (destBB.intersectsRay(src, noY)) {
        return noY
    }

    const midpoint = (destBB.minY + destBB.maxY) / 2
    const upOrDown = midpoint - src.y > 0
    const lerpedY = upOrDown ? lerp(midpoint, destBB.maxY, 0.7) : lerp(midpoint, destBB.minY, 0.7)
    const actualY = lerpedY - src.y
    dir.y = actualY
    return dir.normalize()
        

    // const destPoints = dest.toArray();
    // [this.closeToSrc, this.closeToDest] = this.srcAABBs
    //     .map((aabb) => {
    //         const destTmp = [0, 0, 0];
    //         const srcTmp = [0, 0, 0];
    //         const betweenPoints = getBetweenRectangle(aabb, dest).toArray();
    //         for (let i = 0; i < 3; i++) {
    //             if (
    //                 betweenPoints[i] == destPoints[i] &&
    //                 (betweenPoints[i + 3] == destPoints[i] || betweenPoints[i + 3] == destPoints[i + 3])
    //             ) {
    //                 srcTmp[i] = (betweenPoints[i] + betweenPoints[i + 3]) / 2;
    //                 destTmp[i] = (betweenPoints[i] + betweenPoints[i + 3]) / 2;
    //             } else if (betweenPoints[i] == destPoints[i] || betweenPoints[i + 3] == destPoints[i]) {
    //                 srcTmp[i] = betweenPoints[i];
    //                 destTmp[i] = betweenPoints[i + 3];
    //             } else {
    //                 srcTmp[i] = betweenPoints[i + 3];
    //                 destTmp[i] = betweenPoints[i];
    //             }
    //         }

    //         const closeToDest = new Vec3(destTmp[0], destTmp[1], destTmp[2]);
    //         const closeToSrc = new Vec3(srcTmp[0], srcTmp[1], srcTmp[2]);
    //         let tryIt;
    //         if (destTmp[0] == srcTmp[0] && destTmp[1] == srcTmp[1] && destTmp[2] == srcTmp[2]) {
    //             tryIt = closeToDest.offset(0, 1, 0);
    //         } else {
    //             const dir = closeToDest.minus(closeToSrc).normalize();
    //             tryIt = aabb.intersectsRay(closeToSrc, dir);
    //             tryIt = tryIt!.plus(tryIt!.minus(closeToSrc).normalize().scale(0.3));
    //         }
    //         return [tryIt, closeToDest.offset(0, 1, 0)]; //
    //     })
    //     .filter((i) => !!i[0])
    //     .sort((a, b) => dest.distanceToVec(b[0]!) - dest.distanceToVec(a[0]!))[0];

}

// export function lookingAngleQuaternion(yaw: number, pitch: number) {
//     return new THREE.Quaternion().setFromEuler(new THREE.Euler(yaw, pitch, 0))
// }

// export function targetQuaternion(src: Vec3, dest: Vec3) {
//     const dir = dest.minus(src);
//     const yaw = Math.atan2(-dir.x, -dir.z);
//     const groundDistance = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
//     const pitch = Math.atan2(dir.y, groundDistance);
//     return new THREE.Quaternion().setFromEuler(new THREE.Euler(yaw, pitch, 0))
// }

// export function lookingAngleToEuler(yaw: number, pitch: number) {
//     return new THREE.Euler(yaw <= 0 ? yaw + 2 * Math.PI: yaw, pitch, 0)
// }

// export function targetToEuler(src: Vec3, dest: Vec3) {
//     const dir = dest.minus(src);
//     const yaw = Math.atan2(-dir.x, -dir.z);
//     const groundDistance = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
//     const pitch = Math.atan2(dir.y, groundDistance);
//     return new THREE.Euler(yaw <= 0 ? yaw + 2 * Math.PI: yaw, pitch, 0)
// }
