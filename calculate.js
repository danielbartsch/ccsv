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

const parseCell = (cell, columnIndex, rowIndex, headers, data) => {
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
  return cell
}

const resolveReference = (
  reference /* eg. header1:2 */,
  columnIndex,
  rowIndex,
  headers,
  data
) => {
  const [headerName, lineNumber] = reference.split(":")
  if (Number.isFinite(Number.parseFloat(headerName))) return headerName

  const referencedRowIndex = lineNumber.startsWith("#")
    ? rowIndex + Number.parseFloat(lineNumber.slice(1))
    : lineNumber - 1

  if (referencedRowIndex < 0 || referencedRowIndex >= data.length)
    throw new Error(`Line ${lineNumber} not found`)

  const headerIndex = headerName.startsWith("#")
    ? columnIndex + Number.parseFloat(headerName.slice(1))
    : headers.indexOf(headerName)

  if (headerIndex < 0 || headerIndex >= headers.length)
    throw new Error(`Header \"${headerName}\" not found`)

  return parseCell(
    data[referencedRowIndex][headerIndex],
    headerIndex,
    referencedRowIndex,
    headers,
    data
  )
}

module.exports = calculate
