:- use_module(library(random)).
:- use_module(library(lists)).

:- dynamic greenCount/1.        %Green frog count for board generation
:- dynamic yellowCount/1.       %Yellow frog count for board generation
:- dynamic redCount/1.          %Red frog count for board generation
:- dynamic blueCount/1.         %Blue frog count for board generation

/**************************************************************************
                         Board random generation
***************************************************************************/

generateBoard(Board) :-
        retractall(greenCount(_)),
        retractall(yellowCount(_)),
        retractall(redCount(_)),
        retractall(blueCount(_)),
        assert(greenCount(0)),
        assert(yellowCount(0)),
        assert(redCount(0)),
        assert(blueCount(0)),
        generateBoard([], Board, 12).

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