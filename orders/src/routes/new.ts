import mongoose from 'mongoose'
import { body } from 'express-validator'
import {
    BadRequestError,
    NotFoundError,
    OrderStatus,
    requireAuth,
    validateRequest,
} from '@camthanhtickets/common'
import express, { Request, Response } from 'express'
import { Order } from '../models/order'
import { Ticket } from '../models/ticket'
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher'
import { natsWrapper } from '../nats-wrapper'

const router = express.Router()

const EXPIRATION_WINDOW_SECONDS = 1 * 60 //15 * 60

router.post(
    '/api/orders',
    requireAuth,
    [
        body('ticketId')
            .not()
            .isEmpty()
            .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
            .withMessage('TicketId must be provided'),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        const { ticketId } = req.body

        // Find the ticket the user is trying to order in the database
        const ticket = await Ticket.findById(ticketId)
        if (!ticket) {
            throw new NotFoundError()
        }

        // Make sure that this ticket is not already reserved
        // Run query to look at all orders. Find an order where the ticket
        // is the ticket we just found *and* the orders status is *not* cancelled.
        // If we find an order from that means the ticket *is* reserved

        // const isReserved = await Ticket.isReserved()
        // will wait recommand if teacher found the good solutions now keep code can run
        const existingOrder = await Order.findOne({
            ticket: ticket,
            status: {
                $in: [
                    OrderStatus.Created,
                    OrderStatus.AwaitingPayment,
                    OrderStatus.Complete,
                ],
            },
        })
        const isReserved = !!existingOrder
        if (isReserved) {
            throw new BadRequestError('Ticket is already reserved')
        }

        // Calculate an expiration date for this order
        const expiration = new Date()
        expiration.setSeconds(
            expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS
        )

        // Build the order an save it to the database
        const order = Order.build({
            userId: req.currentUser!.id,
            status: OrderStatus.Created,
            expiresAt: expiration,
            ticket: ticket,
        })
        await order.save()

        // Publish an event saying that an order was created
        new OrderCreatedPublisher(natsWrapper.client).publish({
            id: order.id,
            version: order.version,
            status: order.status,
            userId: order.userId,
            expiresAt: order.expiresAt.toISOString(),
            ticket: {
                id: ticket.id,
                price: ticket.price,
            },
        })

        res.status(201).send(order)
    }
)

export { router as newOrderRouter }
