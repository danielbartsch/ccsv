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
              parseCell(cell, columnIndex, rowIndex, false, headers, data)
            )
            .join(separator)
        )
        return result
      },
      [headers.join(separator)]
    )
    .join("\n")
}

const parseCell = (
  cell = "",
  columnIndex,
  rowIndex,
  isNegated,
  headers,
  data
) => {
  if (cell.startsWith("=")) {
    const cellExpression = [
      ["+", "+"],
      [/(?<!#|^)-/, "-"],
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
      return (isNegated ? -1 : 1) * values[0]
    }

    return eval(
      (isNegated ? "-(" : "") + values.join("") + (isNegated ? ")" : "")
    )
  }
  return cell !== "" && isFinite(cell) ? Number.parseFloat(cell) : cell
}

const resolveReference = (
  reference /* eg. header1:2, -header2:1 */,
  columnIndex,
  rowIndex,
  headers,
  data
) => {
  const functionMatch = reference.match(/(sum|len|avg|min|max)\((.*)\)/)

  if (functionMatch) {
    const [, functionName, parametersString] = functionMatch
    const parameters = parametersString.split(";")

    const values = parameters.flatMap((parameter) => {
      const isRange = parameter.includes(">")
      if (isRange) {
        const [from, to] = parameter.split(">")

        const [fromInfo, toInfo] = [
          parseReference(from, columnIndex, rowIndex, headers, data),
          parseReference(to, columnIndex, rowIndex, headers, data),
        ]

        const fromIndex = Math.min(fromInfo.lineIndex, toInfo.lineIndex)
        const toIndex = Math.max(fromInfo.lineIndex, toInfo.lineIndex)

        const rangeValues = data.flatMap((line, currentRowIndex) =>
          currentRowIndex >= fromIndex && currentRowIndex <= toIndex
            ? parseCell(
                line[fromInfo.headerIndex],
                fromInfo.headerIndex,
                currentRowIndex,
                false,
                headers,
                data
              )
            : []
        )

        return rangeValues
      }

      const { headerIndex, lineIndex, isNegated } = parseReference(
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
                isNegated,
                headers,
                data
              )
            : []
        )
      } else if (lineIndex != null && headerIndex == null) {
        return data[lineIndex].flatMap((column, currentColumnIndex) =>
          columnIndex !== currentColumnIndex
            ? parseCell(
                column,
                currentColumnIndex,
                lineIndex,
                isNegated,
                headers,
                data
              )
            : []
        )
      }
    })

    const numberValues = values.filter((value) => Number.isFinite(value))
    switch (functionName) {
      case "len":
        return values.length
      case "sum":
      case "avg": {
        const sum = numberValues.reduce((sum, value) => sum + value, 0)
        return functionName === "sum" ? sum : sum / values.length
      }
      case "min":
        return Math.min(...numberValues)
      case "max":
        return Math.max(...numberValues)
      default:
        return 0
    }
  }

  const { headerIndex, lineIndex, value, isNegated } = parseReference(
    reference,
    columnIndex,
    rowIndex,
    headers,
    data
  )

  return parseCell(value, headerIndex, lineIndex, isNegated, headers, data)
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

  const isNegated = headerName.startsWith("-")
  const actualHeaderName = isNegated ? headerName.slice(1) : headerName
  const headerIndex = actualHeaderName.startsWith("#")
    ? columnIndex + Number.parseFloat(actualHeaderName.slice(1))
    : headers.indexOf(actualHeaderName)

  if (headerIndex < 0 || headerIndex >= headers.length)
    throw new Error(`Header \"${actualHeaderName}\" not found`)

  return {
    isNegated,
    headerIndex: Number.isNaN(headerIndex) ? undefined : headerIndex,
    lineIndex: Number.isNaN(referencedRowIndex)
      ? undefined
      : referencedRowIndex,
    value: data[referencedRowIndex] && data[referencedRowIndex][headerIndex],
  }
}

module.exports = calculate
