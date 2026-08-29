import { DeviceFingerprintContext, DeviceFingerprintResult } from "../domain/fraud.types";
import { deviceRepository } from "../repositories/device.repository";
import { evaluateDeviceFingerprint } from "../rules/device.rules";

export class DeviceFingerprintervice {
    async evaluate(
        context: DeviceFingerprintContext,
    ): Promise<DeviceFingerprintResult> {
        const device = await deviceRepository.findUserDevice(
            context.userId,
            context.deviceId,
        );

        const userDeviceCount = await deviceRepository.countUserDevices(
            context.userId,
        );

        const deviceTransactionCount24h = await deviceRepository.countDeviceTransacions24h(
            context.userId,
            context.deviceId,
        );

        return evaluateDeviceFingerprint({
            ...context,
            isKnownDevice: Boolean(device),
            userDeviceCount,
            deviceTransactionCount24h,
        })
    }
}

export const deviceFingerprintervice = new DeviceFingerprintervice();