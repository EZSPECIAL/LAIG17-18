/**************************************************************************
           Predicates used for displaying the board or coord lists
***************************************************************************/

%Converts from internal board representation to user friendly output
convertToDisplay(0, ' ').
convertToDisplay(1, 'G').
convertToDisplay(2, 'Y').
convertToDisplay(3, 'R').
convertToDisplay(4, 'B').

%Converts internal Y coordinate to user friendly output
convertColumn(0, 'A').
convertColumn(1, 'B').
convertColumn(2, 'C').
convertColumn(3, 'D').
convertColumn(4, 'E').
convertColumn(5, 'F').
convertColumn(6, 'G').
convertColumn(7, 'H').
convertColumn(8, 'I').
convertColumn(9, 'J').
convertColumn(10, 'K').
convertColumn(11, 'L').

%Prints list of internal X-Y coordinates in user friendly way

printListAsCoords(List) :-
        printListAsCoords(List, 0).

printListAsCoords([], _).

printListAsCoords(List, 8) :- %Line break at X amount of coords printed
        nl,
        printListAsCoords(List, 0).

printListAsCoords([Head|Tail], CurIndex) :-
        X-Y = Head,
        ActualX is X + 1,
        convertColumn(Y, ActualY),
        write('['), write(ActualX),
        write('-'), write(ActualY), write('] '),
        NewIndex is CurIndex + 1,
        printListAsCoords(Tail, NewIndex).

%Pads line with last hyfhen
printSeparatingLine(Count, Count) :-
        write('-').

%Prints a hyfhen separating line with 6 * Counter chars
printSeparatingLine(InitCount, Counter) :-
        write('------'),
        NewCounter is Counter + 1,
        printSeparatingLine(InitCount, NewCounter).

%Pads line with last |
printColumnSeparatorLine(Count, Count) :-
        write('|').

%Prints a | separated line with 6 * Counter chars
printColumnSeparatorLine(InitCount, Counter) :-
        write('|     '),
        NewCounter is Counter + 1,
        printColumnSeparatorLine(InitCount, NewCounter).

%Line finished printing
printLine([]).

%Prints a line with padding
printLine([First|Tail]) :-
        write('|  '),
        convertToDisplay(First, X),
        write(X),
        write('  '),
        printLine(Tail).

%Header finished printing
printHeader(Count, Count).

%Prints a header starting with A and ending on A + Counter
printHeader(InitCount, Counter) :-
        CharCode is Counter + 65,
        write('   '),
        put_code(CharCode),
        write('  '),
        NewCounter is Counter + 1,
        printHeader(InitCount, NewCounter).

%Board finished printing
printBoard([], _) :-
        printSeparatingLine(12, 0), nl.

%Prints a list of lists representing a board, displays in a grid-like array
printBoard([First|Tail], CurrLine) :-
        printSeparatingLine(12, 0), nl,
        printLine(First), write('| '), write(CurrLine), nl,
        NewCurrLine is CurrLine + 1,
        printBoard(Tail, NewCurrLine).

%Prints a list of lists representing a board, prints a header then the board
displayBoard(Board) :-
        printHeader(12, 0), nl,
        printColumnSeparatorLine(12, 0), nl,
        printBoard(Board, 1), !.

%Checks if the coords are from outside the board's boundaries
checkIfOutsideBoard(Row, Column) :-
	Row >= 0, Row < 12, Column >= 0, Column < 12.