// ChangeAggregate.ts
import type { StoredEvent } from "../slices/shared/genericTypes";

export class ChangeAggregate {
  id: string;
  status: "Open" | "Committed" | "Pushed" | "Cancelled" | "Published" = "Open";

  constructor(changeId: string) {
    this.id = changeId;
  }

  apply(event: StoredEvent) {
    const changeId = this.getChangeIdFromEvent(event);
    if (changeId !== this.id) return;

    switch (event.type) {
      case "ChangeCreated":
        this.status = "Open";
        break;
      case "ChangeCommitted":
        this.status = "Committed";
        break;
      case "ChangePushed":
        this.status = "Pushed";
        break;
      case "ChangeCancelled":
        this.status = "Cancelled";
        break;
      case "ChangePublished":
        this.status = "Published";
        break;
      default:
        // no-op for other event types
        break;
    }
  }

  canAddItem(): boolean {
    return this.status === "Open";
  }

  canCommit(): boolean {
    return this.status === "Open";
  }

  canPush(): boolean {
    return this.status === "Committed";
  }

  canCancel(): boolean {
    return this.status === "Open" || this.status === "Committed";
  }

  canPublish(): boolean {
    return this.status === "Committed";
  }

  getStatus(): string {
    return this.status;
  }

  private getChangeIdFromEvent(event: StoredEvent): string {
    return event.payload.changeId;
  }
}
