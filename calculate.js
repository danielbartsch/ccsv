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
    const cellExpression = cell.slice(1)

    const [, match1, operator, match2] =
      cellExpression.match(/(.*:[0-9]+|[0-9]+)(\+|-|\*|\/)(.*:[0-9]|[0-9]+)/) ||
      []

    const value1 = Number.parseFloat(
      resolveReference(
        match1 || cellExpression,
        columnIndex,
        rowIndex,
        headers,
        data
      )
    )
    const value2 = Number.parseFloat(
      resolveReference(
        match2 || cellExpression,
        columnIndex,
        rowIndex,
        headers,
        data
      )
    )

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

    console.log("values", values)

    return functionName === "sum"
      ? values.reduce((sum, value) => sum + value, 0)
      : 0
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
