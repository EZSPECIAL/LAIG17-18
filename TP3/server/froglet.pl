:- include('utils.pl').         %Utility predicates
:- include('display.pl').       %Board display predicates
:- include('ai.pl').            %CPU movement predicates
:- include('test_boards.pl').   %Boards used for testing

:- use_module(library(random)).
:- use_module(library(lists)).

:- dynamic currentPlayer/1.     %Current player turn
:- dynamic player1Type/1.       %Player 1 type (CPU / Human)
:- dynamic player2Type/1.       %Player 2 type (CPU / Human)
:- dynamic cpu1Diff/1.          %CPU 1 difficulty
:- dynamic cpu2Diff/1.          %CPU 2 difficulty

:- dynamic player1Score/1.      %Player 1 score
:- dynamic player2Score/1.      %Player 2 score

:- dynamic greenCount/1.        %Green frog count for board generation
:- dynamic yellowCount/1.       %Yellow frog count for board generation
:- dynamic redCount/1.          %Red frog count for board generation
:- dynamic blueCount/1.         %Blue frog count for board generation

/**************************************************************************
                  Main game predicates and menus
***************************************************************************/

%Game entry point
playGame :-
        setupGame,
        setupGameMenu,
        generateBoard([], Board, 12),
        firstMoveMenu(Board, NewBoard),
        gameLoop(NewBoard),
        resetGame.

%First move of the game
firstMoveMenu(Board, NewBoard) :-
        doFirstMove(Board, NewBoard).

%Execute first move of the game depending on player 1 type
doFirstMove(Board, NewBoard) :-
        getCurrentPlayerType(1, Type),
        doFirstMove(Board, Type, NewBoard).

doFirstMove(Board, human, NewBoard) :-
        firstMove(Board, NewBoard).

doFirstMove(Board, cpu, NewBoard) :-
        displayBoard(Board),
        cpuFirstMove(Board, NewBoard).

%Setup game database
setupGame :-
        assert(currentPlayer(1)),
        assert(player1Score(0)),
        assert(player2Score(0)),
        assert(greenCount(0)),
        assert(yellowCount(0)),
        assert(redCount(0)),
        assert(blueCount(0)).

%Reset game database to initial state
resetGame :-
        retractall(currentPlayer(_)),
        retractall(player1Type(_)),
        retractall(player2Type(_)),
        retractall(cpu1Diff(_)),
        retractall(cpu2Diff(_)),
        retractall(player1Score(_)),
        retractall(player2Score(_)),
        retractall(greenCount(_)),
        retractall(yellowCount(_)),
        retractall(redCount(_)),
        retractall(blueCount(_)).

%Game loop
gameLoop(Board) :-
        clearConsole,
        currentPlayer(PlayerNumber),
        movement(Board, PlayerNumber, NewBoard),
        ite(endGame(NewBoard), printGameOver(NewBoard), gameLoop(NewBoard)).

%Ask for user / cpu move and toggle player
movement(Board, PlayerNumber, NewBoard) :-

        getCurrentPlayerType(PlayerNumber, Type),
        doMove(Board, PlayerNumber, NewBoard, Type),

        togglePlayer(PlayerNumber, NewPlayerNumber),
        retract(currentPlayer(PlayerNumber)),
        assert(currentPlayer(NewPlayerNumber)).

%Get player type and return in Type
getCurrentPlayerType(1, Type) :- player1Type(Type).
getCurrentPlayerType(2, Type) :- player2Type(Type).

%Get CPU difficulty and return in Diff
getCPUDifficulty(1, Diff) :- cpu1Diff(Diff).
getCPUDifficulty(2, Diff) :- cpu2Diff(Diff).

%Chooses correct movement predicate depending on whether player is CPU or human
doMove(Board, PlayerNumber, FinalBoard, cpu) :-
        getCPUDifficulty(PlayerNumber, Diff),
        cpuMove(Board, PlayerNumber, FinalBoard, Diff).

doMove(Board, PlayerNumber, FinalBoard, human) :-
        move(Board, PlayerNumber, FinalBoard).

%Toggles player turn
togglePlayer(1, 2).
togglePlayer(2, 1).

%Writes current score for both players
writeScore :-
        player1Score(Score1),
        player2Score(Score2),
        write('P1 Score: '), write(Score1), write(' P2 Score: '), write(Score2).

%Write current player number and type, does not print new line
writePlayer(PlayerNumber) :-
        write('Current player: '), write(PlayerNumber), write(' '),
        getCurrentPlayerType(PlayerNumber, Type),
        getCPUDifficulty(PlayerNumber, Diff),
        writePlayer(Type, Diff).

writePlayer(human, _) :-
        write('(Human)').

writePlayer(cpu, Diff) :-
        write('(CPU - '), write(Diff), write(')').

%Prints final board and winner
printGameOver(Board) :-
        clearConsole,
        displayBoard(Board),
        writeScore, nl, nl,
        player1Score(Score1),
        player2Score(Score2),
        Score1 > Score2, !,
        write('Player 1 wins!'), nl.

printGameOver(_) :-
        write('Player 2 wins!'), nl.
        
%Checks if the game has ended
endGame(Board) :-
        validMoves(Board, [], NewMoves), !, length(NewMoves, 0).

/**************************************************************************
                               Setup menus
***************************************************************************/

%Ask user for game type by querying about the player types and difficulties if CPU
setupGameMenu :-
        askPlayerType(1),
        askPlayerType(2),
        player1Type(Type1),
        player2Type(Type2),

        askCPUDiff(1, Type1),
        askCPUDiff(2, Type2).

%Queries user for player types, repeats until valid input
askPlayerType(PlayerNumber) :-
        repeat,
        clearConsole,
        
        write('Choose player type for player '), write(PlayerNumber), nl,
        write('1 - Human'), nl,
        write('2 - Robot'), nl,

        read_line(Input),
        verifyMenuInput(Input),
        storePlayerType(PlayerNumber, Input).

%Asserts the player type according to user selection
%storePlayerType(PlayerNumber, Option)
storePlayerType(1, "1") :- assert(player1Type(human)).
storePlayerType(1, "2") :- assert(player1Type(cpu)).
storePlayerType(2, "1") :- assert(player2Type(human)).
storePlayerType(2, "2") :- assert(player2Type(cpu)).

%If PlayerType is human no difficulty is needed from user, assume easy just for safety when trying to access CPU difficulty
askCPUDiff(PlayerNumber, human) :- storeCPUDiff(PlayerNumber, "1").

%Queries user for CPU difficulty, repeats until valid input
%askCPUDiff(PlayerNumber, PlayerType)
askCPUDiff(PlayerNumber, cpu) :-
        repeat,
        clearConsole,

        write('Choose difficulty for CPU '), write(PlayerNumber), nl,
        write('1 - easy'), nl,
        write('2 - hard'), nl,

        read_line(Input),
        verifyMenuInput(Input),
        storeCPUDiff(PlayerNumber, Input).

%Asserts the difficulty according to user selection
%storeCPUDiff(PlayerNumber, Option)
storeCPUDiff(1, "1") :- assert(cpu1Diff(easy)).
storeCPUDiff(1, "2") :- assert(cpu1Diff(hard)).
storeCPUDiff(2, "1") :- assert(cpu2Diff(easy)).
storeCPUDiff(2, "2") :- assert(cpu2Diff(hard)).

%Verifies menu input is a valid option
verifyMenuInput("1").
verifyMenuInput("2").

/**************************************************************************
                         Board random generation
***************************************************************************/

%Generates a 12x12 board by calling the genLine predicate to get a full line and appends it to the intermediate board 12 times
generateBoard(Board, FinalBoard, 0) :- FinalBoard = Board.

generateBoard(Board, FinalBoard, Count) :-
        genLine([], Line, 12),
        append(Board, [Line], NewBoard),
        NewCount is Count - 1,
        generateBoard(NewBoard, FinalBoard, NewCount).

%Generates a line for the board with 12 frogs
genLine(Board, OutBoard, 0) :- OutBoard = Board.

genLine(Board, OutBoard, Count) :-
        genRandFrog(Frog),
        append(Board, [Frog], NewBoard),
        NewCount is Count - 1,
        genLine(NewBoard, OutBoard, NewCount).

%Picks a random frog and validates it by checking if it exceeds limit set by game rules
genRandFrog(Frog) :-
        repeat,
        once(random(1, 5, Frog)),
        once(validateFrog(Frog)).

%Validates green frog limit (66)
validateFrog(1) :-
        greenCount(Green),
        Green \== 66,
        retract(greenCount(_)),
        NewGreen is Green + 1,
        assert(greenCount(NewGreen)).

%Validates yellow frog limit (51)
validateFrog(2) :-
        yellowCount(Yellow),
        Yellow \== 51,
        retract(yellowCount(_)),
        NewYellow is Yellow + 1,
        assert(yellowCount(NewYellow)).

%Validates red frog limit (21)
validateFrog(3) :-
        redCount(Red),
        Red \== 21,
        retract(redCount(_)),
        NewRed is Red + 1,
        assert(redCount(NewRed)).

%Validates blue frog limit (6)
validateFrog(4) :-
        blueCount(Blue),
        Blue \== 6,
        retract(blueCount(_)),
        NewBlue is Blue + 1,
        assert(blueCount(NewBlue)).

/**************************************************************************
                      Create list of valid moves
***************************************************************************/

%Creates list of valid moves in [Points, InitialPos, FinalPos] format
validMoves(Board,Moves, NewMoves) :-
	validMovesCol(Board, Moves, 0, 0, NewMoves).

validMoves(_, Moves, NewMoves) :- NewMoves = Moves.

validMovesCol(_, Moves, _, 12, NewMoves) :-
	NewMoves = Moves.

validMovesCol(Board, Moves, Row, Column, NewMoves) :-
	Column < 12,
	validMovesRow(Board, Moves, Row, Column, NewMoves1),
	NewColumn is Column + 1,
	validMovesCol(Board, NewMoves1, Row, NewColumn, NewMoves).

validMovesRow(_, Moves, 12, _, NewMoves) :-
	NewMoves = Moves.

validMovesRow(Board, Moves, Row, Column, NewMoves) :-
	Row < 12,
	checkValidMoves(Board, Moves, Row, Column, NewMoves1),
	NewRow is Row + 1,
	validMovesRow(Board, NewMoves1, NewRow, Column, NewMoves).

checkValidMove(Board, Moves, Row, Column, DestRow, DestColumn, NewMoves) :-
	checkIfOutsideBoard(DestRow, DestColumn), isJump(DestRow, DestColumn, Row, Column, Board, Points),
	append([[Points, Row - Column, DestRow - DestColumn]], Moves, NewMoves).

checkValidMove(_Board, Moves, _Row, _Column, _DestRow, _DestColumn, NewMoves) :-
	NewMoves = Moves.

checkValidMoves(Board, Moves, Row, Column, FinalMoves) :-
	NewLeft is Row - 2, NewRight is Row + 2, NewUp is Column + 2, NewDown is Column - 2, !,
	checkValidMove(Board, Moves, Row, Column, NewLeft, Column, Moves1), !,
	checkValidMove(Board, Moves1, Row, Column, NewRight, Column, Moves2), !,
	checkValidMove(Board, Moves2, Row, Column, Row, NewUp, Moves3), !,
	checkValidMove(Board, Moves3, Row, Column, Row, NewDown, FinalMoves).

/**************************************************************************
                       Player movement predicates
***************************************************************************/

%Asks user to select a green frog to remove from board for starting the game
firstMove(Board, FinalBoard) :-

        selectCell(Board, first, 1, Row, Column),
        replace(Board, Row, Column, 0, FinalBoard).

%Predicate that is responsible for the player movement
move(Board, PlayerNumber, FinalBoard):-

        repeat,
        selectCell(Board, source, PlayerNumber, Row, Column), %Selects the frog to move and checks if it's possible to move it
        selectCell(Board, destination, PlayerNumber, DestRow, DestColumn), %Selects the coordinates of where to move previously chosen frog

        validMove(DestRow, DestColumn, Row, Column, Board, _),
	moveFrog(Row, Column, DestRow, DestColumn, Board, NewBoard, PlayerNumber),
        doMultipleJump(NewBoard, DestRow, DestColumn, PlayerNumber, FinalBoard).

%Handles multiple jump scenario for human player
doMultipleJump(Board, InitRow, InitColumn, PlayerNumber, FinalBoard) :-
        checkValidMoves(Board, [], InitRow, InitColumn, AvailMoves),
        length(AvailMoves, NumMoves),
        NumMoves > 0,
        askMultipleJump(Board, Input),
        Input == "1", !,
        repeat,
        selectCell(Board, destination, PlayerNumber, DestRow, DestColumn),
        validMove(DestRow, DestColumn, InitRow, InitColumn, Board, _),
        moveFrog(InitRow, InitColumn,DestRow, DestColumn, Board, NewBoard, PlayerNumber),
        doMultipleJump(NewBoard, DestRow, DestColumn, PlayerNumber, FinalBoard).

doMultipleJump(Board, _, _, _, FinalBoard) :- FinalBoard = Board.

%Queries if user wants to jump again, repeats until valid input
askMultipleJump(Board, Input) :-
        repeat,
        clearConsole,
        displayBoard(Board),
        
        write('Multiple jump possible, do jump?'), nl,
        write('1 - yes'), nl,
        write('2 - no'), nl,

        read_line(Input),
        (Input == "1" ; Input == "2"), !.

%Queries user for coordinates of the move, changes according to type which can be source or destination
selectCell(Board, Type, PlayerNumber, Row, Column) :-

        repeat,
        clearConsole,
        printSelection(Board, PlayerNumber, Type),
        getCoords(Row, Column),
        validateSelection(Board, Type, Row, Column), !.

%Prints info for the user according to type of selection
printSelection(Board, PlayerNumber, source) :-
        displayBoard(Board),
        writePlayer(PlayerNumber), nl,
        writeScore, nl, nl,
        nl, write('Select a frog to jump.'), nl,
        write('Available initial positions:'), nl,
        validMoves(Board, [], NewMoves),
        getMatrixColumn(NewMoves, 1, ColumnList),
        printListAsCoords(ColumnList), nl, nl, !.

printSelection(Board, PlayerNumber, destination) :-
        displayBoard(Board),
        writePlayer(PlayerNumber), nl,
        writeScore, nl, nl,
        nl, write('Jump to where?'), nl.

printSelection(Board, _, first) :- 
        displayBoard(Board),
        nl, write('Select a green frog to remove.'), nl.

%Validates player input according to type of move
%If source checks for non empty cell
%If destination checks for empty cell
%If first checks for a green frog
validateSelection(Board, Type, Row, Column) :-

        checkIfOutsideBoard(Row, Column),
        getBoardElement(Board, Row, Column, Cell), !,
        verifySelection(Cell, Type). %Verifies selection stored in Cell

%Verifies cell selection, prints error message when chosen cell isn't a green frog
verifySelection(1, first).
verifySelection(_, first) :- outputMessage('Not a green frog! Choose another cell.').

%Verifies cell selection, prints error message when chosen cell is empty
verifySelection(X, source) :- X \== 0.
verifySelection(_, source) :- outputMessage('Empty cell! Choose another one.').

%Verifies cell selection, prints error message when chosen cell isn't empty
verifySelection(0, destination).
verifySelection(_, destination) :- outputMessage('Not an empty cell! Choose another one.').

/**************************************************************************
                     Overall movement validation
***************************************************************************/

%Verifies if the move is valid by checking if it's a jump over an adjacent frog to an empty space immediately after
validMove(DestRow, DestColumn, SrcRow, SrcCol, Board, Points) :-
	isJump(DestRow, DestColumn, SrcRow, SrcCol, Board, Points).

validMove(_, _, _, _, _, _) :- outputMessage('Not a valid jump! A frog has to jump over an adjacent frog.').

%Checks if the respective movement is a jump over an adjacent frog to empty space.
isJump(DestRow, DestCol, SrcRow, SrcCol, Board, Points) :-

        abs(SrcRow - DestRow, RowDiff),
        abs(SrcCol - DestCol, ColDiff),
        xor(RowDiff == 2, ColDiff == 2),
        TotalDiff is RowDiff + ColDiff,
        TotalDiff == 2,
        getBoardElement(Board, SrcRow, SrcCol, Cell), !,
        not(isEmpty(Cell)),

        delta(DestRow, SrcRow, X),
        IRow is SrcRow + X,
        delta(DestCol, SrcCol, Y),
        IColumn is SrcCol + Y,
        getBoardElement(Board, IRow, IColumn, Points), !,
        not(isEmpty(Points)),

        getBoardElement(Board, DestRow, DestCol, CellF), !,
        isEmpty(CellF).

delta(Y2, Y1, Y3) :- Y2 - Y1 > 0, !, Y3 = 1.
delta(Y2, Y1, Y3) :- Y2 == Y1, !, Y3 = 0.
delta(_, _, Y3) :- Y3 = -1.

%True if 0
isEmpty(0).

/**************************************************************************
                          Game state predicates
***************************************************************************/

%Receives destination and source coordinates and updates frog coordinates on board
moveFrog(FromRow, FromCol, ToRow, ToCol, Board, NewBoard, PlayerNumber) :-

        getBoardElement(Board, FromRow, FromCol, Frog), %Save which Frog will move
        replace(Board, FromRow, FromCol, 0, InterBoard),

        delta(ToRow, FromRow, X),
        IRow is FromRow + X,
        delta(ToCol, FromCol, Y),
        IColumn is FromCol + Y,
        getBoardElement(Board, IRow, IColumn, Points), %Saves Points of move

        updateScore(Points, PlayerNumber),

        replace(InterBoard, IRow, IColumn, 0, InterBoard2),
        replace(InterBoard2, ToRow, ToCol, Frog, NewBoard).

%Update player scores with points from latest move
updateScore(Points, 1) :-
        player1Score(OldScore),
        retract(player1Score(_)),
        NewScore is OldScore + Points,
        assert(player1Score(NewScore)).

updateScore(Points, 2) :-
        player2Score(OldScore),
        retract(player2Score(_)),
        NewScore is OldScore + Points,
        assert(player2Score(NewScore)).
