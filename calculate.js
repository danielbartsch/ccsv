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
  if (!cell.startsWith("=")) {
    return cell !== "" && isFinite(cell) ? Number.parseFloat(cell) : cell
  }
  const cellReferenceRegex = new RegExp(
    `((${headers.join(
      "|"
    )})|(#-?[0-9]+)):(([0-9]+)|(#-?[0-9]+))|((sum|len|avg|min|max)\\(.*\\))`,
    "g"
  )

  const match = cell.match(cellReferenceRegex)
  const resolvedReferenceCell = (match || [])
    .reduce(
      (acc, expression) =>
        acc.replaceAll(
          expression,
          resolveReference(expression, columnIndex, rowIndex, headers, data)
        ),
      cell
    )
    .slice(1)
    .replace(/--/g, "")

  return eval(resolvedReferenceCell)
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
                headers,
                data
              )
            : []
        )

        return rangeValues
      }

      const { headerIndex, lineIndex } = parseReference(
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
