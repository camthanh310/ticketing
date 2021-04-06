import {
    OrderCancelledEvent,
    Publisher,
    Subjects,
} from '@camthanhtickets/common'

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
    readonly subject = Subjects.OrderCancelled
}
