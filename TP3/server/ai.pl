/**************************************************************************
                          CPU movement handling
***************************************************************************/

%Level 1 - cpu plays randomly from available moves, does not do multiple jumps
cpuMove(Board, PlayerNumber, FinalBoard, easy) :-
    displayBoard(Board),
    writePlayer(PlayerNumber), nl,
    writeScore, nl, nl,
    findMove(Board, easy, Moves, Index),
    cpuDoMove(Board, Moves, Index, PreviousX, PreviousY, PlayerNumber, NewBoard),
    doCPUMultipleJump(NewBoard, easy-multiple, PreviousX, PreviousY, PlayerNumber, FinalBoard).

%Level 2 - greedy approach, cpu plays the best move available but does not predict future board states, does multiple jumps
cpuMove(Board, PlayerNumber, FinalBoard, hard) :-
    displayBoard(Board),
    writePlayer(PlayerNumber), nl,
    writeScore, nl, nl,
    findMove(Board, hard, Moves, Index),
    cpuDoMove(Board, Moves, Index, PreviousX, PreviousY, PlayerNumber, NewBoard),
    doCPUMultipleJump(NewBoard, hard-multiple, PreviousX, PreviousY, PlayerNumber, FinalBoard).

%Receives move and changes game state based on it, waits for user input to confirm move
cpuDoMove(Board, Moves, Index, Xf, Yf, PlayerNumber, FinalBoard) :-
    getBoardElement(Moves, Index, 1, Xi - Yi), !,
    getBoardElement(Moves, Index, 2, Xf - Yf), !,

    writeCPUMove(Xi, Yi, Xf, Yf),

    moveFrog(Xi, Yi, Xf, Yf, Board, FinalBoard, PlayerNumber),
    write('Press enter to continue'), nl,
    waitForKey, clearConsole.

%Handles multiple jump scenario for CPU player
doCPUMultipleJump(Board, Diff, InitRow, InitColumn, PlayerNumber, FinalBoard) :-
    checkValidMoves(Board, [], InitRow, InitColumn, AvailMoves),
    length(AvailMoves, NumMoves),
    NumMoves > 0,
    
    findMove(Board, Diff, InitRow, InitColumn, Moves, Index),
    length(Moves, Length),
    Length > 0, !,
    clearConsole,
    displayBoard(Board),
    write('CPU Multiple jump!'), nl,

    cpuDoMove(Board, Moves, Index, PreviousX, PreviousY, PlayerNumber, NewBoard),

    doCPUMultipleJump(NewBoard, Diff, PreviousX, PreviousY, PlayerNumber, FinalBoard).

doCPUMultipleJump(Board, _, _, _, _, FinalBoard) :- FinalBoard = Board.

%Writes CPU jump in user friendly way
writeCPUMove(Xi, Yi, Xf, Yf) :-
    RowI is Xi + 1, RowF is Xf + 1,
    convertColumn(Yi, ColumnI), convertColumn(Yf, ColumnF),

    write('CPU Moves from ['), write(RowI), write(', '), write(ColumnI), write('] '),
    write('to ['), write(RowF), write(', '), write(ColumnF), write(']'), nl.

%Writes CPU first move in user friendly way
writeCPUMove(Xi, Yi) :-
    RowI is Xi + 1,
    convertColumn(Yi, ColumnI),
    write('CPU removes frog at ['), write(RowI), write(', '), write(ColumnI), write('] '), nl.

%Chooses a move for the CPU according to difficulty / type of move
%Easy - chooses move randomly
findMove(Board, easy, Moves, Index) :-
    validMoves(Board, [], Moves),
    length(Moves, Length),
    random(0, Length, Index).

%Hard - chooses best move from current board, no prediction of future board states
findMove(Board, hard, Moves, Index) :-
    validMoves(Board, [], AvailMoves),
    length(AvailMoves, Length),
    sort(AvailMoves, Moves),
    Index is Length - 1.

%Easy multiple jump - chooses randomly whether to do multiple jump
findMove(Board, easy-multiple, Xi, Yi, Moves, Index) :-
    random(0, 2, Random),
    Random > 0,
    checkValidMoves(Board, [], Xi, Yi, Moves),
    length(Moves, Length),
    random(0, Length, Index).

findMove(_, easy-multiple, _, _, [], 0).

%Hard multiple jump - chooses best move from current initial position, which is the position from last move
findMove(Board, hard-multiple, Xi, Yi, Moves, Index) :-
    checkValidMoves(Board, [], Xi, Yi, AvailMoves),
    length(AvailMoves, Length),
    sort(AvailMoves, Moves),
    Index is Length - 1.

%CPU selects a random green frog to remove
cpuFirstMove(Board, FinalBoard) :-
    repeat,
    once(random(0, 12, Row)),
    once(random(0, 12, Column)),
    once(getBoardElement(Board, Row, Column, Cell)),
    Cell == 1,

    writeCPUMove(Row, Column),

    replace(Board, Row, Column, 0, FinalBoard),
    write('Press enter to continue'), nl,
    waitForKey, clearConsole.
