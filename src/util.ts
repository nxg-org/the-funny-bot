import { Bot } from "mineflayer";
import { AABB, AABBUtils, MathUtils } from "@nxg-org/mineflayer-util-plugin";
import * as THREE from "three";
import { Vec3 } from "vec3";
import { Entity } from "prismarine-entity";
import { Block } from "prismarine-block";



export function fetchUser(bot: Bot, name: string, authorName: string) {
    return bot.nearestEntity((e) => e.username === name ?? e.name === name) ?? bot.nearestEntity((e) => e.username === authorName);
}


export function lookingAtEuler(yaw: number, pitch: number) {
    return new THREE.Euler(yaw, pitch, 0);
}

export function targetEuler(src: Vec3, dest: Vec3) {
    const dir = dest.minus(src);
    const yaw = Math.atan2(-dir.x, -dir.z);
    const groundDistance = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
    const pitch = Math.atan2(dir.y, groundDistance);
    return new THREE.Euler(yaw, pitch, 0);
}

type RaycastReturn = {block: Block | null, iterations: {x: number, y: number, z: number, face: number}};
function entityCheck(bot: Bot, maxDistance: number = 3.5) {
    const eyePos = bot.entity.position.offset(0, bot.entity.height, 0);

    const possibleEntities: Entity[] = Object.values(bot.entities)
        .filter((e) => e.position.distanceTo(eyePos) < maxDistance + 3); //arbitrary value, can use true distance for faster calc.
    if (possibleEntities.length === 0) return null;
    
    const possibleAABBs: [entity: Entity, bb: AABB][] = possibleEntities.map((e) => [e, AABBUtils.getEntityAABB(e)]);

    //const dir = MathUtils.yawPitchAndSpeedToDir(bot.entity.yaw, bot.entity.pitch, distance); //vector that bot can reach
    const dir = MathUtils.yawPitchAndSpeedToDir(bot.entity.yaw, bot.entity.pitch, 1).normalize(); // normalized vector

    const intersections: [entity: Entity, intersect: Vec3][] = possibleAABBs
        .map((obj) => [obj[0], obj[1].intersectsRay(eyePos, dir)])
        .filter((obj) => obj[1] !== null) as [entity: Entity, intersect: Vec3][];

    if (intersections.length === 0) return null;

    const sorted = intersections.sort((a, b) => a[1].distanceTo(eyePos) - b[1].distanceTo(eyePos));
    const closestIntersect = sorted[0];

    //untested block detection. Should work fine but whatever.
    const blockIntersect: RaycastReturn = bot.world.raycast(eyePos, dir, maxDistance, null);

    let flag = false;
    if (blockIntersect.block) {
        const blockBB = AABB.fromBlock(blockIntersect.block.position)
        const blockInt = blockBB.intersectsRay(eyePos, dir)
        flag = blockInt ? eyePos.distanceTo(blockInt) < eyePos.distanceTo(closestIntersect[1]) : false
        
    }
    return flag ? null : closestIntersect[0];
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
