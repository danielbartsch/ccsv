let bail = 1
const BAIL_THRESHOLD = 1

let suspendedOutput = []

console.log(`● = success, ◌ = skipped, ⨯ = failed\n`)

const test = (name, func, skip = false) => {
  if (skip) {
    process.stdout.write(`◌ ${name}\n`)
    return
  }
  const logHelper = console.log
  console.log = (...rest) => suspendedOutput.push(...rest)
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
    logHelper(...suspendedOutput)
    console.error(error, "\n\n")
    bail++
    if (bail >= BAIL_THRESHOLD) {
      process.exit(1)
    }
  }
  console.log = logHelper
}

const assertEqual = (a, b) => {
  if (!deepEqual(a, b)) {
    throw new Error(
      `Asserted Equality, but \n"${a}" and \n"${b}"\nwere not equal`
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

module.exports = {
  test,
  assertEqual,
  assertError,
}
