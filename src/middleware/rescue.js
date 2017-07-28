/* @flow */
/* eslint-disable no-ex-assign */
import Timer from "../util/timer"

import {ServiceUnavailable, InternalServerError} from "../errors"

import type {Context, Next, Middleware} from "../middleware"
import type {Request} from "../context"

type CancellingRequest = Request & {
  cancelled?: boolean,
}

type RescueOptions = {
  terminationGrace: number,
}

export default function rescue({terminationGrace = 25000}: RescueOptions = {}): Middleware {
  return async function rescue(next: Next) {
    const ctx: Context = this

    /* Cancel request if server is stopping, but only after a grace period.
       This allows a request to be handled if there is enough time. */
    const timer = new Timer(terminationGrace)
    const stop = async () => {
      await timer.sleep()

      const req: CancellingRequest = ctx.req
      if (req.cancelled) {
        throw new ServiceUnavailable("Please retry the request")
      } else {
        return new Promise(() => {})
      }
    }

    try {
      return await Promise.race([stop(), next()])
    } catch (err) {
      if (!err.expose) {
        if (process.env.NODE_ENV === "test") throw err

        ctx.data.error = err
        err = new InternalServerError
      }

      ctx.body = err
      ctx.status = err.status
    } finally {
      /* Clear timer. It frees setTimeout reference to this context, potentially
         conserving a lot of memory if most requests are short. */
      timer.clear()
    }
  }
}
