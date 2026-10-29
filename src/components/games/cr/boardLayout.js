export function boardSide(tileCount) {
  return Math.max(2, Math.round(tileCount / 4) + 1)
}

export function boardCell(index, tileCount = 32) {
  const edge = boardSide(tileCount) - 1
  let row, col
  if (index <= edge) { row = edge; col = edge - index }
  else if (index <= edge * 2) { row = edge * 2 - index; col = 0 }
  else if (index <= edge * 3) { row = 0; col = index - edge * 2 }
  else { row = index - edge * 3; col = edge }
  return { row, col, x: 50 + (col - row) * 41.5 / edge, y: 10 + (col + row) * 34.5 / edge }
}

export function forwardPath(from, to, size = 32) {
  const steps = []
  let cursor = ((Number(from) % size) + size) % size
  const destination = ((Number(to) % size) + size) % size
  while (cursor !== destination) {
    cursor = (cursor + 1) % size
    steps.push(cursor)
  }
  return steps
}
