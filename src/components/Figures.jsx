
const isPathClear = (fromRow, fromCol, toRow, toCol, board) => {
    const rowStep = toRow === fromRow ? 0 : (toRow > fromRow ? 1 : -1);
    const colStep = toCol === fromCol ? 0 : (toCol > fromCol ? 1 : -1);

    let checkRow = fromRow + rowStep;
    let checkCol = fromCol + colStep;

    while (checkRow !== toRow || checkCol !== toCol) {
        if (board[checkRow][checkCol] !== null) {
            return false;
        }
        checkRow += rowStep;
        checkCol += colStep;
    }
    return true;
};


export const validateBauer = (fromRow, fromCol, toRow, toCol, board, movingPiece, targetPiece) => {
    const isEnte = movingPiece.startsWith("E_");
    const direction = isEnte ? -1 : 1;
    const startRow = isEnte ? 6 : 1;

    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);

    const isStandardMove = colDiff === 0 && rowDiff === direction && !targetPiece;
    const isDoubleMove = colDiff === 0 && fromRow === startRow && rowDiff === 2 * direction && !targetPiece && !board[fromRow + direction][fromCol];
    const isCaptureMove = colDiff === 1 && rowDiff === direction && targetPiece;

    return isStandardMove || isDoubleMove || isCaptureMove;
};

export const validateTurm = (fromRow, fromCol, toRow, toCol, board) => {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol, board);
};

export const validateLaeufer = (fromRow, fromCol, toRow, toCol, board) => {
    if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol, board);
};

export const validateSpringer = (fromRow, fromCol, toRow, toCol) => {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);


    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
};


export const validateDame = (fromRow, fromCol, toRow, toCol, board) => {
    const isStraight = fromRow === toRow || fromCol === toCol;
    const isDiagonal = Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol);

    if (!isStraight && !isDiagonal) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol, board);
};

export const validateKoenig = (fromRow, fromCol, toRow, toCol) => {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    return rowDiff <= 1 && colDiff <= 1;
};