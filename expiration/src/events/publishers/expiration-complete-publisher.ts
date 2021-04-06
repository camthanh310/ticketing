import {
    ExpirationCompleteEvent,
    Publisher,
    Subjects,
} from '@camthanhtickets/common'

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
    subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete
}
