/**************************************************************************
                            Logical operators
***************************************************************************/

%Not operator
not(X):- X, !, fail.
not(_).

%Or operator -> Checks if 1st arg is equal to 2nd or 3rd
or(X, X, _).
or(X, _, X).
or(A, B) :- A ; B.

%And operator
and(A,B) :- A, B.

%Nand operator
nand(A , B) :- not(and(A, B)).

%Xor operator
xor(A, B) :- or(A, B), nand(A, B).

%Abs operator
abs(X, Y):- X < 0, Y is 0 - X.
abs(X, Y):- X >= 0, Y is X.

%If operator
ite(Condition, Then, _) :- Condition, !, Then.
ite(_, _, Else) :- Else.

/**************************************************************************
                            I/O Predicates
***************************************************************************/

getChar(X) :-
        get_char(X),
        get_char(_).

getCode(X) :-
        get_code(X),
        get_code(_).

waitForKey :- get_char(_).

clearConsole :- write('\33\[2J').

% Outputs to the screen the error message passed as argument and then waits for a key, failing afterwards.
outputMessage(Message):-
        write(Message), nl,
        write('Press enter to continue.'),
        waitForKey, !,
        fail.

%Ask user for input on row number and column letter, converts it to numbers only
getCoords(Row, Column) :-
        write('Row: '),
        read_line(RowInput),
        write('Column: '),
        read_line(ColumnInput),

        add_list(RowInput, -48, OutList), %Convert ASCII to number, 48 is 0 in ASCII
        length(RowInput, Length),

        %Verify if list elements are greater than 0
        ite(not(verifyListGTE(OutList, 0)),
            Row is 12,
            ite(Length == 0,
                Row is 12,
                %Convert list to number up to 2 digits
                ite(Length == 1,
                    (list_to_number(OutList, 1, Number), Row is Number - 1),
                    (list_to_number(OutList, 2, Number), Row is Number - 1)
                   )
               )
           ),

        %Convert Column ASCII to number
        ite(nth0(0, ColumnInput, ColumnElem),
            ite(ColumnElem > 96,
                Column is ColumnElem - 97, %Lowercase
                Column is ColumnElem - 65  %Uppercase
               ),
            Column is 12
           ).

/**************************************************************************
                            List manipulation
***************************************************************************/

%Verify if all elements of list are greater than Value
verifyListGTE([], _).

verifyListGTE([Head|Tail], Value) :-
        Head >= Value,
        verifyListGTE(Tail, Value).

%Converts a list of digits to a number up to Length digits
list_to_number(L, Length, Number) :-
    list_to_number(L, Length, 0, Number).

list_to_number(_, 0, N, N).

list_to_number([Head|Tail], Length, A, Number) :-
    !,
    NewA is A * 10 + Head,
    NewLength is Length - 1,
    list_to_number(Tail, NewLength, NewA, Number).

%Adds value to all elements of list
add_list(L, Value, FinalList) :-
        add_list(L, Value, [], FinalList).

add_list([], _, BuildList, BuildList).

add_list([Head|Tail], Value, BuildList, FinalList) :-
        NewValue is Value + Head,
        append(BuildList, [NewValue], NewBuildList),
        add_list(Tail, Value, NewBuildList, FinalList).

%Receives board and cell position. Iterates through the lines until it finds the correct line and calls getRowElement
getBoardElement(_, Row, _, null) :-
        or(
        Row < 0,
        Row >= 12
        ).

getBoardElement(_, _, Column, null) :-
        or(
        Column < 0,
        Column >= 12
        ).

getBoardElement([Line|_], 0, Column, Cell) :-
        getRowElement(Line, Column, Cell).

getBoardElement([_|RestOfBoard], Row, Column, Cell) :-
        Row > 0,
        NewRow is Row - 1,
        getBoardElement(RestOfBoard, NewRow, Column, Cell).

%Receives generic matrix and element position. Iterates through the lines until it finds the correct line and calls getRowElement
getMatrixElement([Line|_], 0, Column, Cell) :-
        getRowElement(Line, Column, Cell).

getMatrixElement([_|MatrixT], Row, Column, Cell) :-
        Row > 0,
        NewRow is Row - 1,
        getMatrixElement(MatrixT, NewRow, Column, Cell).

%Finds the respective column and stores the cell.
getRowElement([Cell|_], 0, Cell).

getRowElement([_|RestOfBoard], Column, Cell) :-
        Column > 0,
        NewColumn is Column - 1,
        getRowElement(RestOfBoard, NewColumn, Cell).

%Returns a list with the full column of a list, reversed
getMatrixColumn(List, ColNum, OutList) :-
        length(List, NumRows),
        StartingIndex is NumRows - 1,
        getMatrixColumn(List, StartingIndex, ColNum, [], OutList).

getMatrixColumn(_, -1, _, BuildList, BuildList).

getMatrixColumn(List, A, ColNum, BuildList, OutList) :-
        getMatrixElement(List, A, ColNum, Cell),
        append(BuildList, [Cell], NewBuildList),
        NewA is A - 1,
        getMatrixColumn(List, NewA, ColNum, NewBuildList, OutList).

%Replace element in 2D list
%Once we find the desired row,
replace([L|Ls], 0, Y, Z, [R|Ls]) :-
        replace_column(L, Y, Z, R). %We replace specified column, and we're done.

%If we haven't found the desired row yet
replace([L|Ls], X, Y, Z, [L|Rs]) :-
        X > 0,                     %and the row offset is positive,
        X1 is X - 1,               %we decrement the row offset
        replace(Ls, X1, Y, Z, Rs). %and recurse down

%Once we find the specified offset, just make the substitution and finish up.
replace_column([_|Cs], 0, Z, [Z|Cs]).

%Otherwise,
replace_column( [C|Cs] , Y , Z , [C|Rs] ) :-
        Y > 0,                         %assuming that the column offset is positive,
        Y1 is Y - 1,                   %we decrement it
        replace_column(Cs, Y1, Z, Rs). %and recurse down.