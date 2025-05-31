import { StoredEvent } from "../slices/shared/genericTypes";

export class ChangeAggregate {
  private isOpen: boolean = false;

  apply(event: StoredEvent) {
    if (event.type === "ChangeCreated" && event.payload.status === "Open") {
      this.isOpen = true;
    }
  }

  canCreate(): boolean {
    return !this.isOpen;
  }
}
