import { AvailabilityStatus } from "../../../../libs/messages";

export interface StatusStrategyInterface {
    applyBasicRules(): void;
    applyTimedRules(): void;
    applyInteractionRules(): void;
    cleanTimedRules(): void;
    applyAllRules(): void;
    getActualStatus(): AvailabilityStatus;
    setUserNameInteraction(userName: string): void;
    allowNotificationSound(): boolean;
}
