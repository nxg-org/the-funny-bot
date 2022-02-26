import { Vec3 } from "vec3";
import { AABB, AABBUtils, MathUtils } from "@nxg-org/mineflayer-util-plugin";
import { Entity } from "prismarine-entity";
export const {dirToYawAndPitch, yawPitchAndSpeedToDir, getYaw, toRadians} = MathUtils

export function movingTowards(origin: Vec3, destination: Vec3, velocity: Vec3) {
    return origin.distanceTo(destination) < origin.plus(velocity).distanceTo(destination);
}

export function movingAt(origin: Vec3, destination: Vec3, velocity: Vec3, maxOffset: number) {
    return Math.abs(dirToYawAndPitch(velocity.normalize()).yaw - getYaw(origin, destination)) < maxOffset;
}

export function lookingAt(origin: Entity, target: Entity, maxDistance?: number): boolean {
    const dir = yawPitchAndSpeedToDir(origin.yaw, origin.pitch, 1);
    return lookingAtFromRay(origin.position.offset(0, origin.height, 0), AABBUtils.getEntityAABBRaw({position: target.position, height: target.height, width: target.width ?? 0.6}), dir, maxDistance)

}

export function lookingAtXZ(origin: Entity, target: Entity, maxOffset: number): boolean {
    return Math.abs(origin.yaw - getYaw(origin.position, target.position)) < maxOffset;
}

export function lookingAtFromRay(origin: Vec3, target: AABB, dir: Vec3, maxDistance?: number): boolean {
    if (!maxDistance) {
        return !!target.intersectsRay(origin, dir);
    } else {
        const res = target.intersectsRay(origin, dir);
        return res ? origin.distanceTo(res) < maxDistance : false;
    }
}

export function lookingAtFromSegment(origin: Vec3, target: AABB, endpoint: Vec3) {
    return target.intersectsSegment(origin, endpoint);
}
