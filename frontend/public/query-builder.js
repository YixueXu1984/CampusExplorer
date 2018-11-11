/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    query["WHERE:"] = extractConditions();
    query["OPTIONS"] = {};
    query.OPTIONS["COLUMNS:"] = extractColumns();
    extractOrder();
    extractGroups();
    extractTransformations();
    return query;
};

function extractConditions() {
    let conditions = document.getElementsByClassName("condition");
    let builtConditions = [];

    for (let i = 0; i < conditions.length; i++) {
        builtConditions.push(extractCondition(conditions[i]));
    }

    if(builtConditions.length > 1) {

        if (document.getElementById("courses-conditiontype-all").checked) {
            builtConditions = wrapInAnd(builtConditions);
        } else if (document.getElementById("courses-conditiontype-any").checked) {
            builtConditions = wrapInOr(builtConditions);
        } else if (document.getElementById("courses-conditiontype-none").checked) {
           builtConditions = wrapInNot(builtConditions);
        }

        return builtConditions;

    } else {
        return builtConditions[0];
    }
}

function wrapInAnd(builtConditions) {
    return {AND: builtConditions};
}

function wrapInOr(builtConditions) {
    return {OR: builtConditions};
}

function wrapInNot(builtConditions) {
    // wraps every condition in a NOT
    let negatedBuiltConditions = [];
    builtConditions.forEach((condition) => {
        negatedBuiltConditions.push({NOT: condition})
    });
    return {AND: negatedBuiltConditions};
}

function extractColumns() {
    let builtColumns = [];
    let columns = document.getElementsByClassName("columns")[0].getElementsByClassName("control-group")[0].children;

    for(let i = 0; i < columns.length; i++) {
        let columnCheckBox = columns.item(i).children[0];
        if (columnCheckBox.checked) {
            builtColumns.push(columnCheckBox.value);
        }
    }

    return builtColumns;
}

function extractOrder() {
    return null;
}

function extractGroups() {
    return null;
}

function extractTransformations() {
    return null;
}

function extractCondition(conditionElement) {
    let condition = {};
    let not = extractNot(conditionElement.getElementsByClassName("control not"));
    let key = extractKey(conditionElement.getElementsByClassName("control fields"));
    let operator = extractOperator(conditionElement.getElementsByClassName("control operators"));
    let input = extractInput(conditionElement.getElementsByClassName("control term"));

    let keyInput = {};
    keyInput[key] = input;
    condition[operator] = keyInput;

    if (not === true) {
        let notCondition = {
            NOT: condition
        };

        return notCondition;
    } else {
        return condition;
    }
}

function extractNot(notElement) {
    return notElement[0].firstElementChild.checked;
}

function extractKey(keyElement) {
    let selections = keyElement[0].children[0];
    return selections.options[selections.selectedIndex].value;
}

function extractInput(inputElement) {
    return inputElement[0].firstElementChild.value;
}

function extractOperator(operatorElement) {
    let selections = operatorElement[0].children[0];
    return selections.options[selections.selectedIndex].value.toUpperCase();
}

