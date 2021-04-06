import {
    PaymentCreatedEvent,
    Publisher,
    Subjects,
} from '@camthanhtickets/common'

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
    subject: Subjects.PaymentCreated = Subjects.PaymentCreated
}
