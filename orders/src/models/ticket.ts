import { updateIfCurrentPlugin } from 'mongoose-update-if-current'
import mongoose from 'mongoose'
import { Order, OrderStatus } from './order'

interface TicketAttrs {
    id: string
    title: string
    price: number
}

export interface TicketDoc extends mongoose.Document {
    title: string
    price: number
    version: number
    isReserved(): boolean
}

interface TicketModel extends mongoose.Model<TicketDoc> {
    build(attrs: TicketAttrs): TicketDoc
    findByEvent(event: {
        id: string
        version: number
    }): Promise<TicketDoc | null>
    isReserved(): boolean
}

const ticketSchema = new mongoose.Schema<TicketDoc, TicketModel>(
    {
        title: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        toJSON: {
            transform(doc, ret) {
                ret.id = ret._id
                delete ret._id
            },
        },
    }
)

ticketSchema.set('versionKey', 'version')
// @ts-ignore
ticketSchema.plugin(updateIfCurrentPlugin)

ticketSchema.statics.findByEvent = (event: { id: string; version: number }) => {
    return Ticket.findOne({
        _id: event.id,
        version: event.version - 1,
    })
}

ticketSchema.statics.build = (attrs: TicketAttrs) => {
    return new Ticket({
        _id: attrs.id,
        title: attrs.title,
        price: attrs.price,
    })
}

// ticketSchema.statics.isReserved = async () => {
//     // this === the ticket document that we just called 'isReserved' on
//     const existingOrder = await Order.findOne({
//         ticket: this,
//         status: {
//             $in: [
//                 OrderStatus.Created,
//                 OrderStatus.AwaitingPayment,
//                 OrderStatus.Complete,
//             ],
//         },
//     })

//     return !!existingOrder
// }

// @ts-ignore
ticketSchema.methods.isReserved = async function () {
    // this === the ticket document that we just called 'isReserved' on
    const existingOrder = await Order.findOne({
        // @ts-ignore
        ticket: this,
        status: {
            $in: [
                OrderStatus.Created,
                OrderStatus.AwaitingPayment,
                OrderStatus.Complete,
            ],
        },
    })

    return !!existingOrder
}

const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket', ticketSchema)

export { Ticket }
