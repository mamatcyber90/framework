import timekeeper from "timekeeper"

import {InternalServerError} from "src/errors"
import Logger from "src/util/logger"
import MemoryConsole from "src/util/memory-console"
import {log, write} from "src/middleware"

describe("log", function() {
  before(function() {
    timekeeper.freeze(new Date(1330688329321))
    this.logger = new Logger(new MemoryConsole, Logger.JSON)
  })

  describe("on success", function() {
    describe("without proxy", function() {
      before(async function() {
        this.logger.console.clear()
        const {res, body} = await test.request(
          test.createStack(log(this.logger), write(), function() {
            this.body = "ok"
            this.status = 201
          }), {
            method: "POST",
            path: "/foo",
            body: "foobar",
          }
        )

        this.entry = JSON.parse(this.logger.console.stdout.toString())
      })

      it("should log message", function() {
        assert.equal(this.entry.message, "created")
      })

      it("should log request method", function() {
        assert.equal(this.entry.httpRequest.requestMethod, "POST")
      })

      it("should log request url", function() {
        assert.equal(this.entry.httpRequest.requestUrl, "/foo")
      })

      it("should log request size", function() {
        assert.equal(this.entry.httpRequest.requestSize, 89)
      })

      it("should log response status", function() {
        assert.equal(this.entry.httpRequest.status, 201)
      })

      it("should log response size", function() {
        assert.equal(this.entry.httpRequest.responseSize, 101)
      })

      it("should log remote ip", function() {
        assert.equal(this.entry.httpRequest.remoteIp, "::ffff:127.0.0.1")
      })

      it("should log latency", function() {
        assert.match(this.entry.httpRequest.latency, /\d+\.\d{3}s/)
      })
    })

    describe("with proxy", function() {
      before(async function() {
        this.logger.console.clear()
        const {res, body} = await test.request(
          test.createStack(log(this.logger), write(), function() {
            this.body = "ok"
            this.status = 201
          }), {
            method: "POST",
            path: "/foo",
            body: "foobar",
            headers: {
              "x-forwarded-for": "185.110.132.232, 35.186.220.41"
            },
          }
        )

        this.entry = JSON.parse(this.logger.console.stdout.toString())
      })

      it("should log message", function() {
        assert.equal(this.entry.message, "created")
      })

      it("should log request method", function() {
        assert.equal(this.entry.httpRequest.requestMethod, "POST")
      })

      it("should log request url", function() {
        assert.equal(this.entry.httpRequest.requestUrl, "/foo")
      })

      it("should log request size", function() {
        assert.equal(this.entry.httpRequest.requestSize, 138)
      })

      it("should log response status", function() {
        assert.equal(this.entry.httpRequest.status, 201)
      })

      it("should log response size", function() {
        assert.equal(this.entry.httpRequest.responseSize, 101)
      })

      it("should log remote ip", function() {
        assert.equal(this.entry.httpRequest.remoteIp, "185.110.132.232")
      })

      it("should log latency", function() {
        assert.match(this.entry.httpRequest.latency, /\d+\.\d{3}s/)
      })
    })
  })

  describe("on error", function() {
    describe("without proxy", function() {
      before(async function() {
        this.logger.console.clear()
        const {res, body} = await test.request(
          test.createStack(log(this.logger), write(), function() {
            this.data.error = new Error
            this.status = 500
            this.body = new InternalServerError
          }), {
            method: "POST",
            path: "/foo",
            body: "foobar",
          }
        )

        this.entry = JSON.parse(this.logger.console.stdout.toString())
      })

      it("should log error", function() {
        assert.include(this.entry.message, "Error")
      })

      it("should log request method", function() {
        assert.equal(this.entry.httpRequest.requestMethod, "POST")
      })

      it("should log request url", function() {
        assert.equal(this.entry.httpRequest.requestUrl, "/foo")
      })

      it("should log request size", function() {
        assert.equal(this.entry.httpRequest.requestSize, 89)
      })

      it("should log response status", function() {
        assert.equal(this.entry.httpRequest.status, 500)
      })

      it("should log response size", function() {
        assert.equal(this.entry.httpRequest.responseSize, 213)
      })

      it("should log remote ip", function() {
        assert.equal(this.entry.httpRequest.remoteIp, "::ffff:127.0.0.1")
      })

      it("should log latency", function() {
        assert.match(this.entry.httpRequest.latency, /\d+\.\d{3}s/)
      })
    })
  })
})
