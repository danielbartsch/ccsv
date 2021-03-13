const calculate = require("./calculate.js")
const { test, assertEqual, assertError, run } = require("./testfrm.js")

test("no calculations", () => {
  const file = ["a,b", "0,10,10", "10,0,0", "0,10,0", "10,0,10"].join("\n")
  assertEqual(calculate(file), file)
})

test("don't touch iso date format", () => {
  const file = [
    "date",
    "2021-03-13",
    "2021-03-14",
    "2021-03-15",
    "2021-03-16",
    "2021-03-17",
    "2021-03-18",
    "2021-03-19",
    "2021-03-20",
  ].join("\n")
  assertEqual(calculate(file), file)
})

test("cell assignment", () =>
  assertEqual(
    calculate(
      ["a,b", "0,10,=a:1", "10,0,=a:2", "0,10,=b:1", "10,0,=b:2"].join("\n")
    ),
    ["a,b", "0,10,0", "10,0,10", "0,10,10", "10,0,0"].join("\n")
  ))

test("parenthesis", () =>
  assertEqual(
    calculate(
      [
        "fraction,full,percentage",
        "10,100,=(fraction:#0/full:#0)*100",
        "50,50,=(fraction:#0/full:#0)*100",
        "100,90,=(fraction:#0/full:#0)*100",
      ].join("\n")
    ),
    [
      "fraction,full,percentage",
      "10,100,10",
      "50,50,100",
      "100,90,111.11111111111111",
    ].join("\n")
  ))

test(
  "wrong reference",
  () =>
    assertError(() =>
      calculate(["a,b", "0,10,=a:1", "10,0,=c:2", "10,0,=a:2"].join("\n"))
    ),
  true
)

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

test("multiple operators", () =>
  assertEqual(
    calculate(
      ["a", "=20+30+50,=10+20*10", "30,=a:1+a:2+a:2", "10,=a:2"].join("\n")
    ),
    ["a", "100,210", "30,160", "10,30"].join("\n")
  ))

test("negating", () =>
  assertEqual(
    calculate(
      ["a", "=0-20+10,=0+10-20", "=-20+10,=10-20", "=a:2,=-a:2"].join("\n")
    ),
    ["a", "-10,-10", "-10,-10", "-10,10"].join("\n")
  ))

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

test("sum with separator", () =>
  assertEqual(
    calculate(
      ["sum", "100", "-9", "-20", "-30", "-10", "---", "=sum(sum)"].join("\n")
    ),
    ["sum", "100", "-9", "-20", "-30", "-10", "---", "31"].join("\n")
  ))

test("accumulated sum", () =>
  assertEqual(
    calculate(
      [
        "transaction,sum",
        "100,=sum(transaction:#0>transaction:1)",
        "-9,=sum(transaction:#0>transaction:1)",
        "-5,=sum(transaction:#0>transaction:1)",
        "-20,=sum(transaction:#0>transaction:1)",
        "-30,=sum(transaction:#0>transaction:1)",
        "-10,=sum(transaction:#0>transaction:1)",
        "-5,=sum(transaction:#0>transaction:1)",
        "100,=sum(transaction:#0>transaction:1)",
        "-10,=sum(transaction:#0>transaction:1)",
        "-20,=sum(transaction:#0>transaction:1)",
        "-40,=sum(transaction:#0>transaction:1)",
        "-30,=sum(transaction:#0>transaction:1)",
        "100,=sum(transaction:#0>transaction:1)",
        "-50,=sum(transaction:#0>transaction:1)",
        "=sum(transaction)",
      ].join("\n")
    ),
    [
      "transaction,sum",
      "100,100",
      "-9,91",
      "-5,86",
      "-20,66",
      "-30,36",
      "-10,26",
      "-5,21",
      "100,121",
      "-10,111",
      "-20,91",
      "-40,51",
      "-30,21",
      "100,121",
      "-50,71",
      "71",
    ].join("\n")
  ))

test("accumulated sum reverse", () =>
  assertEqual(
    calculate(
      [
        "transaction,reverse_sum",
        "100,=sum(transaction:#0>transaction:14)",
        "-9,=sum(transaction:#0>transaction:14)",
        "-5,=sum(transaction:#0>transaction:14)",
        "-20,=sum(transaction:#0>transaction:14)",
        "-30,=sum(transaction:#0>transaction:14)",
        "-10,=sum(transaction:#0>transaction:14)",
        "-5,=sum(transaction:#0>transaction:14)",
        "100,=sum(transaction:#0>transaction:14)",
        "-10,=sum(transaction:#0>transaction:14)",
        "-20,=sum(transaction:#0>transaction:14)",
        "-40,=sum(transaction:#0>transaction:14)",
        "-30,=sum(transaction:#0>transaction:14)",
        "100,=sum(transaction:#0>transaction:14)",
        "-50,=sum(transaction:#0>transaction:14)",
      ].join("\n")
    ),
    [
      "transaction,reverse_sum",
      "100,71",
      "-9,-29",
      "-5,-20",
      "-20,-15",
      "-30,5",
      "-10,35",
      "-5,45",
      "100,50",
      "-10,-50",
      "-20,-40",
      "-40,-20",
      "-30,20",
      "100,50",
      "-50,-50",
    ].join("\n")
  ))

test("rolling average", () =>
  assertEqual(
    calculate(
      [
        "number,rollingavg",
        "5,=avg(number:#0>number:#1)",
        "10,=avg(number:#-1>number:#1)",
        "15,=avg(number:#-1>number:#1)",
        "200,=avg(number:#-1>number:#1)",
        "0,=avg(number:#-1>number:#1)",
        "100,=avg(number:#-1>number:#1)",
        "50,=avg(number:#-1>number:#0)",
      ].join("\n")
    ),
    [
      "number,rollingavg",
      "5,7.5",
      "10,10",
      "15,75",
      "200,71.66666666666667",
      "0,100",
      "100,50",
      "50,75",
    ].join("\n")
  ))

run()
