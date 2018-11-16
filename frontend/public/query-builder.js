/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    let formDocument = document.getElementsByClassName("tab-panel active")[0];
    let dataSetId = document.getElementsByClassName("nav-item tab active")[0].getAttribute("data-type");
    query["WHERE"] = extractConditions(dataSetId, formDocument);
    let columns = extractColumns(dataSetId, formDocument);
    let order = extractOrder(dataSetId, formDocument);

    if(columns.length > 0 || order.keys.length > 0) {
        query["OPTIONS"] = {};
    }

    if (columns.length > 0) {
        query.OPTIONS["COLUMNS"] = columns;
    }
    if (order.keys.length > 0) {
        query.OPTIONS["ORDER"] = order;
    }
    let groups = extractGroups(dataSetId, formDocument);
    let applys = extractTransformations(dataSetId, formDocument);
    if (groups.length > 0 || applys.length > 0) {
        query["TRANSFORMATIONS"] = {};
    }
    if (groups.length > 0) {
        query.TRANSFORMATIONS["GROUP"] = groups;
    }

    if (applys.length > 0) {
        query.TRANSFORMATIONS["APPLY"] = applys;
    }
    return query;
};

function extractConditions(dataSetId, formDocument) {

    let conditions = formDocument.getElementsByClassName("conditions-container")[0].children;
    let builtConditions = [];

    for (let i = 0; i < conditions.length; i++) {
        builtConditions.push(extractCondition(conditions[i], dataSetId));
    }

    if (builtConditions.length > 1) {

        if (formDocument.getElementsByClassName("control conditions-all-radio")[0].children[0].checked) {
            builtConditions = wrapInAnd(builtConditions);
        } else if (formDocument.getElementsByClassName("control conditions-any-radio")[0].children[0].checked) {
            builtConditions = wrapInOr(builtConditions);
        } else if (formDocument.getElementsByClassName("control conditions-none-radio")[0].children[0].checked) {
            builtConditions = wrapInNot(builtConditions);
        }

        return builtConditions;

    } else if (builtConditions.length === 1) {
        return builtConditions[0];
    } else {
        return {};
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

function extractColumns(dataSetId, formDocument) {
    let builtColumns = [];
    let columns = formDocument.getElementsByClassName("columns")[0].getElementsByClassName("control-group")[0].children;

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

function extractOrder(dataSetId, formDocument) {
    let builtOrders = {
        dir: "",
        keys: []
    };

    let orderByFields = formDocument.getElementsByClassName("control order fields")[0].firstElementChild.children;
    let orderDirection = formDocument.getElementsByClassName("control descending")[0].children[0];

    for (let i = 0; i < orderByFields.length; i++) {
        let orderByFieldsValue = orderByFields.item(i);
        if (orderByFieldsValue.selected && orderByFieldsValue.className === "transformation") {
            builtOrders.keys.push(orderByFieldsValue.value);
        } else if (orderByFieldsValue.selected) {
            builtOrders.keys.push(dataSetId + "_" + orderByFieldsValue.value);
        }
    }

    if (orderDirection.checked) {
        builtOrders.dir = "DOWN";
    } else {
        builtOrders.dir = "UP";
    }

    return builtOrders;
}

function extractGroups(dataSetId, formDocument) {
    let groups = [];
    let groupForm = formDocument.getElementsByClassName("form-group groups")[0];
    let groupSelections = groupForm.getElementsByClassName("control-group")[0].children;

    for (let i = 0; i < groupSelections.length; i++) {
        let groupCheckbox = groupSelections.item(i).children[0];
        if (groupCheckbox.checked) {
            groups.push(dataSetId + "_" + groupCheckbox.value);
        }
    }

    return groups;
}

function extractTransformations(dataSetId, formDocument) {
    let apply = [];
    let transformations = formDocument.getElementsByClassName("transformations-container")[0].children;
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

