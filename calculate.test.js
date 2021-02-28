const calculate = require("./calculate.js")
const { test, assertEqual, assertError, run } = require("./testfrm.js")

test("no calculations", () => {
  const file = [
    "header1,header2",
    "0,10,10",
    "10,0,0",
    "0,10,0",
    "10,0,10",
  ].join("\n")
  assertEqual(calculate(file), file)
})

test("cell assignment", () =>
  assertEqual(
    calculate(
      [
        "header1,header2",
        "0,10,=header1:1",
        "10,0,=header1:2",
        "0,10,=header2:1",
        "10,0,=header2:2",
      ].join("\n")
    ),
    ["header1,header2", "0,10,0", "10,0,10", "0,10,10", "10,0,0"].join("\n")
  ))

test("wrong reference", () =>
  assertError(() =>
    calculate(
      [
        "header1,header2",
        "0,10,=header1:1",
        "10,0,=header3:2",
        "10,0,=header1:2",
      ].join("\n")
    )
  ))

test("sum", () =>
  assertEqual(
    calculate(
      [
        "header1,header2",
        "0,10,=header1:1+header1:1",
        "10,0,=header2:1+header2:1",
        "10,0,=header1:3+header2:1",
      ].join("\n")
    ),
    ["header1,header2", "0,10,0", "10,0,20", "10,0,20"].join("\n")
  ))

test("difference", () =>
  assertEqual(
    calculate(
      ["header1", "30,=header1:1-header1:2", "10,=header1:2-header1:1"].join(
        "\n"
      )
    ),
    ["header1", "30,20", "10,-20"].join("\n")
  ))

test("product", () =>
  assertEqual(
    calculate(
      ["header1", "30,=header1:1*header1:2", "10,=header1:2*header1:1"].join(
        "\n"
      )
    ),
    ["header1", "30,300", "10,300"].join("\n")
  ))

test("quotient", () =>
  assertEqual(
    calculate(
      ["header1", "30,=header1:1/header1:2", "10,=header1:2/header1:1"].join(
        "\n"
      )
    ),
    ["header1", "30,3", "10,0.3333333333333333"].join("\n")
  ))

test(
  "multiple operators",
  () =>
    assertEqual(
      calculate(
        ["header1", "30,=header1:1+header1:2+header1:2", "10,=header1:2"].join(
          "\n"
        )
      ),
      ["header1", "30,50", "10,10"]
    ),
  true
)

test(
  "negating",
  () =>
    assertEqual(
      calculate(["header1", "30,=-header1:1", "0,=header1:1"].join("\n")),
      ["header1", "30,-30", "0,30"]
    ),
  true
)

test("numbers", () =>
  assertEqual(
    calculate(
      ["header1,header2", "30,=50+header1:1", "0,=header2:1"].join("\n")
    ),
    ["header1,header2", "30,80", "0,80"].join("\n")
  ))

test("chained references", () =>
  assertEqual(
    calculate(["header1,header2", "30,=header1:1", "0,=header2:1"].join("\n")),
    ["header1,header2", "30,30", "0,30"].join("\n")
  ))

test("chained references and operators", () =>
  assertEqual(
    calculate(
      [
        "header1,header2",
        "30,=header1:1+header1:1",
        "0,=header2:1",
        "10,=header2:1+70",
        "10,=header2:3+header1:4",
      ].join("\n")
    ),
    ["header1,header2", "30,60", "0,60", "10,130", "10,140"].join("\n")
  ))

test("relative line references", () =>
  assertEqual(
    calculate(
      [
        "header1,header2",
        "30,=header1:#0",
        "20,=header1:#0",
        "10,=header1:#1",
        "0,=header1:#-1",
      ].join("\n")
    ),
    ["header1,header2", "30,30", "20,20", "10,0", "0,10"].join("\n")
  ))

test("relative column references", () =>
  assertEqual(
    calculate(
      [
        "header1,header2,header3",
        "30,=#-1:#0,50",
        "20,=#1:#0,60",
        "10,=#1:1,5",
        "0,=#-1:1,10",
      ].join("\n")
    ),
    [
      "header1,header2,header3",
      "30,30,50",
      "20,60,60",
      "10,50,5",
      "0,30,10",
    ].join("\n")
  ))

test("references and calculations", () =>
  assertEqual(
    calculate(
      ["header1", "10", "=#0:#-1", "=#0:#-2", "=#0:#-3", "=#0:#-4"].join("\n")
    ),
    ["header1", "10", "10", "10", "10", "10"].join("\n")
  ))

test("relative reference to relative reference", () =>
  assertEqual(
    calculate(["header1", "10", "=#0:#-1", "=#0:#-1"].join("\n")),
    ["header1", "10", "10", "10"].join("\n")
  ))

test("sum function", () =>
  assertEqual(
    calculate(
      [
        "header1,header2",
        "10,=#-1:#0",
        "20,=#-1:#0",
        "30,=#-1:#0",
        "=sum(header1),=sum(header2)",
      ].join("\n")
    ),
    ["header1,header2", "10,10", "20,20", "30,30", "60,60"].join("\n")
  ))

test("sum function relative", () =>
  assertEqual(
    calculate(
      [
        "header1,header2,header3,header4",
        "10,=#-1:#0",
        "20,=#-1:#0",
        "30,=#-1:#0",
        "40,30,20,10,=sum(##:#0)",
        "=sum(#0:##),=sum(#0:##)",
      ].join("\n")
    ),
    [
      "header1,header2,header3,header4",
      "10,10",
      "20,20",
      "30,30",
      "40,30,20,10,100",
      "100,90",
    ].join("\n")
  ))

test("sum with empty columns", () =>
  assertEqual(
    calculate(
      [
        ",header1,header2,sum",
        ",0,=header1:2,=sum(##:#0)",
        ",10,=header2:1,=sum(##:#0)",
      ].join("\n")
    ),
    [",header1,header2,sum", ",0,10,10", ",10,10,20"].join("\n")
  ))

test("avg len min max", () =>
  assertEqual(
    calculate(
      [
        ",,header1,header2,header3",
        ",,-1,0,1,=header1:2,=min(##:#0)",
        ",,10,=header2:1,=max(##:#0)",
        "sumo,=len(#0:##),=avg(#0:##),,=avg(#0:##)",
      ].join("\n")
    ),
    [
      ",,header1,header2,header3",
      ",,-1,0,1,10,-1",
      ",,10,0,10",
      "sumo,2,4.5,,5.5",
    ].join("\n")
  ))

test("functions with operators", () =>
  assertEqual(
    calculate(["header1", "10", "20", "30", "=sum(#0:##)*2"].join("\n")),
    ["header1", "10", "20", "30", "120"].join("\n")
  ))

run()
