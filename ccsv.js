#! /bin/node
const fs = require("fs")
const calculate = require("./calculate.js")

const [
  ,
  ,
  inputFilePath,
  outputFilePath = inputFilePath.replace(".ccsv", ".csv"),
  separator = ",",
  ...args
] = process.argv

if (args.length > 0) {
  console.log(
    "First argument: input file\nSecond argument: output file\nThird argument: separator (eg. ',', ';')"
  )
  process.exit(1)
}

fs.readFile(inputFilePath, { encoding: "utf8" }, (error, inputFileData) => {
  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  fs.writeFile(outputFilePath, calculate(inputFileData, separator), () => {
    console.log("saved to", outputFilePath)
  })
})
