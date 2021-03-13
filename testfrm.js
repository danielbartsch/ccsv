const [, , testFilter = ""] = process.argv

const BAIL_THRESHOLD = Number.parseInt(process.env.BAIL) || 0

let suspendedOutput = []

console.log(`● = success, ◌ = skipped, ⨯ = failed\n`)

const tests = []

const test = (name, func, skip = false) => {
  tests.push([
    name,
    () => {
      const logHelper = console.log
      console.log = (...rest) => suspendedOutput.push(...rest, "\n")
      const beginning = Date.now()
      try {
        process.stdout.write(`… ${name}`)
        func()
        process.stdout.cursorTo(0)
        process.stdout.write(`● ${name} (${Date.now() - beginning}ms)\n`)
        suspendedOutput = []
        return "pass"
      } catch (error) {
        process.stdout.cursorTo(0)
        process.stdout.write(`⨯ ${name} (${Date.now() - beginning}ms)\n`)
        if (suspendedOutput.length > 0) logHelper("\n", ...suspendedOutput)
        console.error(error, "\n\n")
        return "failure"
      } finally {
        console.log = logHelper
      }
    },
    skip,
  ])
}

const assertEqual = (a, b) => {
  if (!deepEqual(a, b)) {
    throw new Error(
      `Asserted equality, but \n${a.replace(/\n/g, "\\n")}\n${b.replace(
        /\n/g,
        "\\n"
      )}\nwere not equal`
    )
  }
}

const deepEqual = (x, y) => {
  if (x === y) {
    return true
  } else if (
    typeof x == "object" &&
    x != null &&
    typeof y == "object" &&
    y != null
  ) {
    if (Object.keys(x).length != Object.keys(y).length) return false
    for (const prop in x) {
      if (y.hasOwnProperty(prop)) {
        if (!deepEqual(x[prop], y[prop])) return false
      } else return false
    }
    return true
  } else return false
}

const assertError = (func) => {
  try {
    func()
  } catch (error) {
    return
  }
  throw new Error("Asserted Error, but none was thrown")
}

const run = () => {
  const beginning = Date.now()
  const testsToRun = tests.filter(([name]) => name.includes(testFilter))
  if (testFilter) {
    console.log(
      `running ${testsToRun.length}/${tests.length} tests (filtering for '${testFilter}')`
    )
  }
  let testsPassed = 0
  let testsFailed = 0
  let testsSkipped = 0
  let interruptedTests = false
  try {
    testsToRun.forEach(([name, execute, skip]) => {
      if (skip) {
        testsSkipped++
        process.stdout.write(`◌ ${name}\n`)
      } else {
        if (execute() === "failure") {
          testsFailed++
          if (testsFailed > BAIL_THRESHOLD) {
            interruptedTests = true
            throw new Error()
          }
        } else {
          testsPassed++
        }
      }
    })
  } catch (e) {
  } finally {
    console.log(
      `\n${
        interruptedTests
          ? `INTERRUPTED tests by failure (allowed failed tests: ${BAIL_THRESHOLD}. failed tests: ${testsFailed})\n\n`
          : ""
      }Tests: ${
        testsFailed > 0 ? `${testsFailed} failed, ` : ""
      }${testsPassed} passed, ${
        testsSkipped > 0 ? `${testsSkipped} skipped, ` : ""
      }${testsToRun.length} total\nTime:  ${Date.now() - beginning}ms`
    )
  }
}

module.exports = {
  run,
  test,
  assertEqual,
  assertError,
}
