/* eslint-env mocha */
'use strict'

const assert = require('assert')
const RpcEngine = require('../src/index.js')

describe('basic tests', function () {
  it('basic middleware test', function (done) {
    let engine = new RpcEngine()

    engine.push(function (req, res, next, end) {
      res.result = 42
      end()
    })

    let payload = { id: 1, jsonrpc: '2.0', method: 'hello' }

    engine.handle(payload, function (err, res) {
      assert.ifError(err, 'did not error')
      assert(res, 'has res')
      assert.equal(res.result, 42, 'has expected result')
      done()
    })
  })

  it('allow null result', function (done) {
    let engine = new RpcEngine()

    engine.push(function (req, res, next, end) {
      res.result = null
      end()
    })

    let payload = { id: 1, jsonrpc: '2.0', method: 'hello' }

    engine.handle(payload, function (err, res) {
      assert.ifError(err, 'did not error')
      assert(res, 'has res')
      assert.equal(res.result, null, 'has expected result')
      done()
    })
  })

  it('interacting middleware test', function (done) {
    let engine = new RpcEngine()

    engine.push(function (req, res, next, end) {
      req.resultShouldBe = 42
      next()
    })

    engine.push(function (req, res, next, end) {
      res.result = req.resultShouldBe
      end()
    })

    let payload = { id: 1, jsonrpc: '2.0', method: 'hello' }

    engine.handle(payload, function (err, res) {
      assert.ifError(err, 'did not error')
      assert(res, 'has res')
      assert.equal(res.result, 42, 'has expected result')
      done()
    })
  })

  it('empty middleware test', function (done) {
    let engine = new RpcEngine()

    let payload = { id: 1, jsonrpc: '2.0', method: 'hello' }

    engine.handle(payload, function (err, res) {
      assert(err, 'did error')
      done()
    })
  })

  it('handle batch payloads', function (done) {
    let engine = new RpcEngine()

    engine.push(function (req, res, next, end) {
      res.result = req.id
      end()
    })

    let payloadA = { id: 1, jsonrpc: '2.0', method: 'hello' }
    let payloadB = { id: 2, jsonrpc: '2.0', method: 'hello' }
    let payload = [payloadA, payloadB]

    engine.handle(payload, function (err, res) {
      assert.ifError(err, 'did not error')
      assert(res, 'has res')
      assert(Array.isArray(res), 'res is array')
      assert.equal(res[0].result, 1, 'has expected result')
      assert.equal(res[1].result, 2, 'has expected result')
      done()
    })
  })

  it('return handlers test', function (done) {
    let engine = new RpcEngine()

    engine.push(function (req, res, next, end) {
      next(function (cb) {
        res.sawReturnHandler = true
        cb()
      })
    })

    engine.push(function (req, res, next, end) {
      res.result = true
      end()
    })

    let payload = { id: 1, jsonrpc: '2.0', method: 'hello' }

    engine.handle(payload, function (err, res) {
      assert.ifError(err, 'did not error')
      assert(res, 'has res')
      assert(res.sawReturnHandler, 'saw return handler')
      done()
    })
  })

  it('return order of events', function (done) {
    let engine = new RpcEngine()

    let events = []

    engine.push(function (req, res, next, end) {
      events.push('1-next')
      next(function (cb) {
        events.push('1-return')
        cb()
      })
    })

    engine.push(function (req, res, next, end) {
      events.push('2-next')
      next(function (cb) {
        events.push('2-return')
        cb()
      })
    })

    engine.push(function (req, res, next, end) {
      events.push('3-end')
      res.result = true
      end()
    })

    let payload = { id: 1, jsonrpc: '2.0', method: 'hello' }

    engine.handle(payload, function (err, res) {
      assert.ifError(err, 'did not error')
      assert.equal(events[0], '1-next', '(event 0) was "1-next"')
      assert.equal(events[1], '2-next', '(event 1) was "2-next"')
      assert.equal(events[2], '3-end', '(event 2) was "3-end"')
      assert.equal(events[3], '2-return', '(event 3) was "2-return"')
      assert.equal(events[4], '1-return', '(event 4) was "1-return"')
      done()
    })
  })
})
