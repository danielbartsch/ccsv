let testFailures = 0

const [, , testFilter = ""] = process.argv

const BAIL_THRESHOLD = Number.parseInt(process.env.BAIL) || 1

let suspendedOutput = []

console.log(`● = success, ◌ = skipped, ⨯ = failed\n`)

const tests = []

const test = (name, func, skip = false) => {
  tests.push([
    name,
    () => {
      if (skip) {
        process.stdout.write(`◌ ${name}\n`)
        return
      }
      const logHelper = console.log
      console.log = (...rest) => suspendedOutput.push(...rest, "\n")
      const beginning = Date.now()
      try {
        process.stdout.write(`… ${name}`)
        func()
        process.stdout.cursorTo(0)
        process.stdout.write(`● ${name} (${Date.now() - beginning}ms)\n`)
        suspendedOutput = []
      } catch (error) {
        process.stdout.cursorTo(0)
        process.stdout.write(`⨯ ${name} (${Date.now() - beginning}ms)\n`)
        if (suspendedOutput.length > 0) logHelper("\n", ...suspendedOutput)
        console.error(error, "\n\n")
        testFailures++
        if (testFailures >= BAIL_THRESHOLD) {
          throw new Error(
            `${testFailures} tests failed. Not continuing with other tests, because that's more than the defined ${BAIL_THRESHOLD}`
          )
        }
      } finally {
        console.log = logHelper
      }
    },
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
  let testsRan = 0
  try {
    testsToRun.forEach(([name, execute]) => {
      testsRan++
      execute()
    })
  } catch (e) {
  } finally {
    console.log(
      `\nExecution time ${Date.now() - beginning}ms (${testsRan}${
        testsRan !== testsToRun.length ? `/${testsToRun.length}` : ""
      } tests)`
    )
  }
}

module.exports = {
  run,
  test,
  assertEqual,
  assertError,
}
