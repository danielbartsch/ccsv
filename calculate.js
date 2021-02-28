const calculate = (fileData, separator = ",") => {
  const [headers, ...data] = fileData
    .split("\n")
    .map((line) => line.split(separator))
  return data
    .reduce(
      (result, line, rowIndex) => {
        result.push(
          line
            .map((cell, columnIndex) =>
              parseCell(cell, columnIndex, rowIndex, headers, data)
            )
            .join(separator)
        )
        return result
      },
      [headers.join(separator)]
    )
    .join("\n")
}

const parseCell = (cell = "", columnIndex, rowIndex, headers, data) => {
  if (cell.startsWith("=")) {
    const cellExpression = [
      ["+", "+"],
      [/(?<!#)-/, "-"],
      ["*", "*"],
      ["/", "/"],
    ].reduce(
      (acc, [operatorRegex, operator]) =>
        acc.flatMap((part) =>
          part
            .split(operatorRegex)
            .flatMap((element, index, array) =>
              index === array.length - 1 ? [element] : [element, operator]
            )
        ),
      [cell.slice(1)]
    )

    const values = cellExpression.map((expression) =>
      ["+", "-", "*", "/"].includes(expression)
        ? expression
        : Number.parseFloat(
            resolveReference(expression, columnIndex, rowIndex, headers, data)
          )
    )

    if (values.length === 1) {
      return values[0]
    }
    const threeBuckets = chunk(values, 3).map(([value1, operator, value2]) => {
      switch (operator) {
        case "+":
          return value1 + value2
        case "-":
          return value1 - value2
        case "*":
          return value1 * value2
        case "/":
          return value1 / value2
        default:
          return value1
      }
    })

    if (threeBuckets.length === 1) {
      return threeBuckets[0]
    }

    return undefined
  }
  return Number.isFinite(Number.parseFloat(cell))
    ? Number.parseFloat(cell)
    : cell
}

const resolveReference = (
  reference /* eg. header1:2 */,
  columnIndex,
  rowIndex,
  headers,
  data
) => {
  const isFunction = reference.includes("(")

  if (isFunction) {
    const functionName = reference.substring(0, reference.indexOf("("))
    const parameters = reference
      .substring(reference.indexOf("(") + 1, reference.lastIndexOf(")"))
      .split(";")

    const values = parameters.flatMap((parameter) => {
      const { headerIndex, lineIndex, value } = parseReference(
        parameter,
        columnIndex,
        rowIndex,
        headers,
        data
      )

      if (headerIndex != null && lineIndex == null) {
        return data.flatMap((line, currentRowIndex) =>
          rowIndex !== currentRowIndex
            ? parseCell(
                line[headerIndex],
                headerIndex,
                currentRowIndex,
                headers,
                data
              )
            : []
        )
      } else if (lineIndex != null && headerIndex == null) {
        return data[lineIndex].flatMap((column, currentColumnIndex) =>
          columnIndex !== currentColumnIndex
            ? parseCell(column, currentColumnIndex, lineIndex, headers, data)
            : []
        )
      }
    })

    const numberValues = values.filter((value) => Number.isFinite(value))
    switch (functionName) {
      case "sum":
        return numberValues.reduce((sum, value) => sum + value, 0)
      case "len":
        return values.length
      case "avg":
        return (
          numberValues.reduce((sum, value) => sum + value, 0) / values.length
        )
      case "min":
        return Math.min(...numberValues)
      case "max":
        return Math.max(...numberValues)
      default:
        return 0
    }
  }

  const { headerIndex, lineIndex, value } = parseReference(
    reference,
    columnIndex,
    rowIndex,
    headers,
    data
  )

  return parseCell(value, headerIndex, lineIndex, headers, data)
}

const parseReference = (reference, columnIndex, rowIndex, headers, data) => {
  const [headerName, lineNumber] = reference.split(":")
  if (Number.isFinite(Number.parseFloat(headerName)))
    return { value: headerName }

  const referencedRowIndex =
    lineNumber == null
      ? undefined
      : lineNumber.startsWith("#")
      ? rowIndex + Number.parseFloat(lineNumber.slice(1))
      : lineNumber - 1

  if (referencedRowIndex < 0 || referencedRowIndex >= data.length)
    throw new Error(`Line ${lineNumber} not found`)

  const headerIndex = headerName.startsWith("#")
    ? columnIndex + Number.parseFloat(headerName.slice(1))
    : headers.indexOf(headerName)

  if (headerIndex < 0 || headerIndex >= headers.length)
    throw new Error(`Header \"${headerName}\" not found`)

  return {
    headerIndex: Number.isNaN(headerIndex) ? undefined : headerIndex,
    lineIndex: Number.isNaN(referencedRowIndex)
      ? undefined
      : referencedRowIndex,
    value: data[referencedRowIndex] && data[referencedRowIndex][headerIndex],
  }
}

module.exports = calculate

function chunk(array, size = 3) {
  if (array.length === 0) {
    return []
  }
  var index = 0,
    resIndex = 0,
    result = Array(Math.ceil(array.length / size))

  while (index < array.length) {
    result[resIndex++] = array.slice(index, (index += size))
  }
  return result
}
