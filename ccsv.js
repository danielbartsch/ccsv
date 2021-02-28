#! /bin/node
const fs = require("fs")
const calculate = require("./calculate.js")

const [, , ...args] = process.argv

if (args.length === 0) {
  console.log("Add a file to compile")
  process.exit(1)
}

const [inputFilePath, separator = ","] = args

fs.readFile(inputFilePath, { encoding: "utf8" }, (error, inputFileData) => {
  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  console.log(calculate(inputFileData, separator))
})
