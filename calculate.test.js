const calculate = require("./calculate.js")
const { test, assertEqual, assertError, run } = require("./testfrm.js")

test("no calculations", () => {
  const file = ["a,b", "0,10,10", "10,0,0", "0,10,0", "10,0,10"].join("\n")
  assertEqual(calculate(file), file)
})

test("cell assignment", () =>
  assertEqual(
    calculate(
      ["a,b", "0,10,=a:1", "10,0,=a:2", "0,10,=b:1", "10,0,=b:2"].join("\n")
    ),
    ["a,b", "0,10,0", "10,0,10", "0,10,10", "10,0,0"].join("\n")
  ))

test("wrong reference", () =>
  assertError(() =>
    calculate(["a,b", "0,10,=a:1", "10,0,=c:2", "10,0,=a:2"].join("\n"))
  ))

test("sum", () =>
  assertEqual(
    calculate(
      ["a,b", "0,10,=a:1+a:1", "10,0,=b:1+b:1", "10,0,=a:3+b:1"].join("\n")
    ),
    ["a,b", "0,10,0", "10,0,20", "10,0,20"].join("\n")
  ))

test("difference", () =>
  assertEqual(
    calculate(["a", "30,=a:1-a:2", "10,=a:2-a:1"].join("\n")),
    ["a", "30,20", "10,-20"].join("\n")
  ))

test("product", () =>
  assertEqual(
    calculate(["a", "30,=a:1*a:2", "10,=a:2*a:1"].join("\n")),
    ["a", "30,300", "10,300"].join("\n")
  ))

test("quotient", () =>
  assertEqual(
    calculate(["a", "30,=a:1/a:2", "10,=a:2/a:1"].join("\n")),
    ["a", "30,3", "10,0.3333333333333333"].join("\n")
  ))

test(
  "multiple operators",
  () =>
    assertEqual(calculate(["a", "30,=a:1+a:2+a:2", "10,=a:2"].join("\n")), [
      "a",
      "30,50",
      "10,10",
    ]),
  true
)

test(
  "negating",
  () =>
    assertEqual(calculate(["a", "30,=-a:1", "0,=a:1"].join("\n")), [
      "a",
      "30,-30",
      "0,30",
    ]),
  true
)

test("numbers", () =>
  assertEqual(
    calculate(["a,b", "30,=50+a:1", "0,=b:1"].join("\n")),
    ["a,b", "30,80", "0,80"].join("\n")
  ))

test("chained references", () =>
  assertEqual(
    calculate(["a,b", "30,=a:1", "0,=b:1"].join("\n")),
    ["a,b", "30,30", "0,30"].join("\n")
  ))

test("chained references and operators", () =>
  assertEqual(
    calculate(
      ["a,b", "30,=a:1+a:1", "0,=b:1", "10,=b:1+70", "10,=b:3+a:4"].join("\n")
    ),
    ["a,b", "30,60", "0,60", "10,130", "10,140"].join("\n")
  ))

test("relative line references", () =>
  assertEqual(
    calculate(
      ["a,b", "30,=a:#0", "20,=a:#0", "10,=a:#1", "0,=a:#-1"].join("\n")
    ),
    ["a,b", "30,30", "20,20", "10,0", "0,10"].join("\n")
  ))

test("relative column references", () =>
  assertEqual(
    calculate(
      [
        "a,b,c",
        "30,=#-1:#0,50",
        "20,=#1:#0,60",
        "10,=#1:1,5",
        "0,=#-1:1,10",
      ].join("\n")
    ),
    ["a,b,c", "30,30,50", "20,60,60", "10,50,5", "0,30,10"].join("\n")
  ))

test("references and calculations", () =>
  assertEqual(
    calculate(
      ["a", "10", "=#0:#-1", "=#0:#-2", "=#0:#-3", "=#0:#-4"].join("\n")
    ),
    ["a", "10", "10", "10", "10", "10"].join("\n")
  ))

test("relative reference to relative reference", () =>
  assertEqual(
    calculate(["a", "10", "=#0:#-1", "=#0:#-1"].join("\n")),
    ["a", "10", "10", "10"].join("\n")
  ))

test("sum function", () =>
  assertEqual(
    calculate(
      ["a,b", "10,=#-1:#0", "20,=#-1:#0", "30,=#-1:#0", "=sum(a),=sum(b)"].join(
        "\n"
      )
    ),
    ["a,b", "10,10", "20,20", "30,30", "60,60"].join("\n")
  ))

test("sum function relative", () =>
  assertEqual(
    calculate(
      [
        "a,b,c,d",
        "10,=#-1:#0",
        "20,=#-1:#0",
        "30,=#-1:#0",
        "40,30,20,10,=sum(##:#0)",
        "=sum(#0:##),=sum(#0:##)",
      ].join("\n")
    ),
    ["a,b,c,d", "10,10", "20,20", "30,30", "40,30,20,10,100", "100,90"].join(
      "\n"
    )
  ))

test("sum with empty columns", () =>
  assertEqual(
    calculate(
      [",a,b,sum", ",0,=a:2,=sum(##:#0)", ",10,=b:1,=sum(##:#0)"].join("\n")
    ),
    [",a,b,sum", ",0,10,10", ",10,10,20"].join("\n")
  ))

test("avg len min max", () =>
  assertEqual(
    calculate(
      [
        ",,a,b,c",
        ",,-1,0,1,=a:2,=min(##:#0)",
        ",,10,=b:1,=max(##:#0)",
        "sumo,=len(#0:##),=avg(#0:##),,=avg(#0:##)",
      ].join("\n")
    ),
    [",,a,b,c", ",,-1,0,1,10,-1", ",,10,0,10", "sumo,2,4.5,,5.5"].join("\n")
  ))

test("functions with operators", () =>
  assertEqual(
    calculate(["a", "10", "20", "30", "=sum(#0:##)*2"].join("\n")),
    ["a", "10", "20", "30", "120"].join("\n")
  ))

run()
