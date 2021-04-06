import {
    Publisher,
    Subjects,
    TicketCreatedEvent,
} from '@camthanhtickets/common'

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
    readonly subject = Subjects.TicketCreated
}
