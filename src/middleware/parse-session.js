/* @flow */
/* eslint-disable no-unused-expressions */
import type {Context, Next, Middleware} from "../middleware"

import Cookies from "cookies"

type SessionOptions = {
  name?: string,
  keys?: Array<string>,
  maxAge?: number,
}

function decode(string) {
  const body = new Buffer(string, "base64").toString("utf8")
  return JSON.parse(body)
}

function encode(body) {
  const string = JSON.stringify(body)
  return new Buffer(string).toString("base64")
}

const day = 24 * 60 * 60 * 1000

export default function parseSession({name = "sess", keys, maxAge = 90 * day}: SessionOptions = {}): Middleware {
  return async function parseSession(next: Next) {
    (this: Context)

    let session, cookie
    const socket: tls$TLSSocket | net$Socket = this.request.socket
    const secure = socket.encrypted || this.request.headers["x-forwarded-proto"] === "https"
    const cookies = new Cookies(this.request, this.response, {keys, secure})

    /* https://github.com/facebook/flow/issues/285 */
    Object.defineProperty(this.data, "session", ({
      get: () => {
        if (session !== undefined) return session

        cookie = cookies.get(name, {maxAge})
        if (cookie) {
          try {
            session = decode(cookie)
          } catch (err) {
            session = {}
          }
        } else {
          session = {}
        }

        return session
      },

      set: value => {
        if (typeof value !== "object") {
          throw new TypeError("Session must be an object")
        }

        if (cookie === undefined) {
          cookie = cookies.get(name, {maxAge})
        }

        session = value
      },
    }: Object))

    try {
      await next()
    } finally {
      if (session === undefined) {
        /* Session not used. */
      } else if (session && Object.keys(session).length) {
        const encoded = encode(session)
        if (encoded !== cookie) {
          /* Only set session if it has changed. */
          cookies.set(name, encoded, {maxAge})
        }
      } else if (cookies.get(name, {signed: false})) {
        /* Session cookies were invalid. Clear session & signature. */
        cookies.set(name, null, {signed: false})
        cookies.set(name + ".sig", null, {signed: false})
      }
    }
  }
}
