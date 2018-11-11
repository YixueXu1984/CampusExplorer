/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    let dataSetId = "courses";
    query["WHERE"] = extractConditions(dataSetId);
    let columns = extractColumns(dataSetId);
    if (columns.length > 0) {
        query["OPTIONS"] = {};
        query.OPTIONS["COLUMNS"] = columns;
        query.OPTIONS["ORDER"] = extractOrder(dataSetId);
    }
    let groups = extractGroups(dataSetId);
    let applys = extractTransformations(dataSetId);
    if (groups.length > 0) {
        query["TRANSFORMATIONS"] = {};
        query.TRANSFORMATIONS["GROUP"] = groups;
        query.TRANSFORMATIONS["APPLY"] = applys;
    }
    return query;
};

function extractConditions(dataSetId) {

        let conditions = document.getElementsByClassName("conditions-container")[0].children;
        let builtConditions = [];

        for (let i = 0; i < conditions.length; i++) {
            builtConditions.push(extractCondition(conditions[i], dataSetId));
        }

        if (builtConditions.length > 1) {

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

function extractColumns(dataSetId) {
        let builtColumns = [];
        let columns = document.getElementsByClassName("columns")[0].getElementsByClassName("control-group")[0].children;

        for (let i = 0; i < columns.length; i++) {
            let columnCheckBox = columns.item(i).children[0];
            if (columnCheckBox.checked && columns.item(i).className === "control field") {
                builtColumns.push(dataSetId + "_" + columnCheckBox.value);
            } else if (columnCheckBox.checked) {
                builtColumns.push(columnCheckBox.value);
            }
        }

        return builtColumns;
}

function extractOrder(dataSetId) {
        let builtOrders = {
            dir: "",
            keys: []
        };

        let orderByFields = document.getElementsByClassName("control order fields")[0].firstElementChild.children;
        let orderDirection = document.getElementById("courses-order");

        for (let i = 0; i < orderByFields.length; i++) {
            if (orderByFields.item(i).selected) {
                builtOrders.keys.push(dataSetId + "_" + orderByFields.item(i).value);
            }
        }

        if (builtOrders.length === 0) {
            return null;
        }

        if (orderDirection.checked) {
            builtOrders.dir = "DOWN";
        } else {
            builtOrders.dir = "UP";
        }


        return builtOrders;
}

function extractGroups(dataSetId) {
        let groups = [];
        let groupForm = document.getElementsByClassName("form-group groups")[0];
        let groupSelections = groupForm.getElementsByClassName("control-group")[0].children;

        for (let i = 0; i < groupSelections.length; i++) {
            let groupCheckbox = groupSelections.item(i).children[0];
            if (groupCheckbox.checked) {
                groups.push(dataSetId + "_" + groupCheckbox.value);
            }
        }

        return groups;
}

function extractTransformations(dataSetId) {
        let apply = [];
        let transformations = document.getElementsByClassName("transformations-container")[0].children;
        for (let i = 0; i < transformations.length; i++) {
            let applyName = extractApplyName(transformations[i]);
            let applyFunction = extractApplyFunction(transformations[i]);
            let applyColumn = extractApplyColumn(transformations[i]);

            let applyFunToCol = {};
            applyFunToCol[applyFunction] = dataSetId + "_" + applyColumn;
            let applyFunToColName = {};
            applyFunToColName[applyName] = applyFunToCol

            apply.push(applyFunToColName);
        }
        return apply;
}

function extractApplyName(transformation) {
    return transformation.getElementsByClassName("control term")[0].children[0].value;
}

function extractApplyFunction(transformation) {
    let selections = transformation.getElementsByClassName("control operators")[0].children[0];
    return selections.options[selections.selectedIndex].value;
}

function extractApplyColumn(transformation) {
    let selections = transformation.getElementsByClassName("control fields")[0].children[0];
    return selections.options[selections.selectedIndex].value;
}

function extractCondition(conditionElement, dataSetId) {
    let condition = {};
    let not = extractNot(conditionElement.getElementsByClassName("control not"));
    let key = extractKey(conditionElement.getElementsByClassName("control fields"));
    let operator = extractOperator(conditionElement.getElementsByClassName("control operators"));
    let input = extractInput(conditionElement.getElementsByClassName("control term"));

    let keyInput = {};
    keyInput[dataSetId + "_" + key] = input;
    condition[operator] = keyInput;

    if (not === true) {
        return {
            NOT: condition
        };
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
    let inputValue = inputElement[0].firstElementChild.value;
    if (isNaN(inputValue)) {
        return inputValue;
    } else {
        return Number(inputValue);
    }
}

function extractOperator(operatorElement) {
    let selections = operatorElement[0].children[0];
    return selections.options[selections.selectedIndex].value.toUpperCase();
}

