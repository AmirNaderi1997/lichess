import React from 'react';
import { Chessboard } from 'react-chessboard';

const THEMES = {
    green: { dark: '#779556', light: '#ebecd0' },
    brown: { dark: '#b58863', light: '#f0d9b5' },
    blue: { dark: '#8ca2ad', light: '#dee3e6' },
    purple: { dark: '#9b72cb', light: '#e8dff5' },
};

const ChessBoard = ({ position, onMove, orientation, theme = 'green' }) => {
    const boardTheme = THEMES[theme] || THEMES.green;

    return (
        <div className="w-full max-w-[600px] aspect-square shadow-2xl rounded overflow-hidden">
            <Chessboard
                options={{
                    position: position,
                    onPieceDrop: ({ sourceSquare, targetSquare }) => onMove(sourceSquare, targetSquare),
                    boardOrientation: orientation,
                    allowDragging: true,
                    darkSquareStyle: { backgroundColor: boardTheme.dark },
                    lightSquareStyle: { backgroundColor: boardTheme.light },
                    animationDurationInMs: 300,
                }}
            />
        </div>
    );
};

export default ChessBoard;
