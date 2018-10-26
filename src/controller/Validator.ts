import {InsightDatasetKind} from "./IInsightFacade";
import {COLUMN_KEYS, MCOMP_KEYS, SCOMP_KEYS} from "./Enums";
import {IColumnObject} from "../model/ColumnObject";

export default class Validator {
    constructor() {
        // validator
    }

    // ---- VALIDATORS START --- //
    public validateColumnKeys(dataSetKey: string): boolean {
        return (Object.values(COLUMN_KEYS).includes(dataSetKey));
    }

    // TODO: change how order is validated
    public validateOrder(columnsToQuery: IColumnObject, orderKeys: string[]): boolean {
        let columnsAllKeys = columnsToQuery.columnKeys.concat(columnsToQuery.columnApplykeys);
        return orderKeys.every((orderKey) => {
            return columnsAllKeys.includes(orderKey);
        });
    }

    public isAnd(filter: string): boolean {
        return filter === "AND";
    }

    public isOr(filter: string): boolean {
        return filter === "OR";
    }

    public isNeg(filter: string): boolean {
        return filter === "NOT";
    }

    public isMcomp(filter: string): boolean {
        return filter === "LT" || filter === "GT" || filter === "EQ";
    }

    public isScomp(filter: string): boolean {
        return filter === "IS";
    }

    public validateKey(key: string, filterName: string): boolean {
        if (this.isMcomp(filterName) && this.validateMcompKey(key)) {
            return true;
        } else if (this.isScomp(filterName) && this.validateScompKey(key)) {
            return true;
        } else {
            return false;
        }
    }

    public validateMcompKey(key: string): boolean {
        return Object.values(MCOMP_KEYS).includes(key);
    }

    public validateScompKey(key: string): boolean {
        return Object.values(SCOMP_KEYS).includes(key);
    }

    public validateInputValue(input: string | number, filterName: string): boolean {
        if (this.isMcomp(filterName) && typeof input === "number") {
            return true;
        } else if (this.isScomp(filterName) && typeof input === "string" && this.validateInputString(input)) {
            return true;
        } else {
            return false;
        }
    }

    public validateLcomp(body: any[]): boolean {
        if (body.length >= 1) {
            return true;
        } else {
            return false;
        }
    }

    public validateNeg(body: any[]): boolean {
        if (Object.keys(body).length === 1) {
            return true;
        } else {
            return false;
        }
    }

    public validateInputString(input: string): boolean {
        let testInput = input;
        if (input.length >= 3) {
            testInput = input.substring(1, input.length - 1);
            let charsNotAsterix = testInput.match(/[*]/);

            if (charsNotAsterix === undefined || charsNotAsterix === null) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }

    }

    // TODO: these validations
    // one or more of any character except underscore.
    public validateApplyKeyStructure(key: string): boolean {
        return key.length !== 0 && !key.includes("_");
    }

    // The applykey in an APPLYRULE should be unique (no two APPLYRULE's should share an applykey with the same name).
    public isUniqueApplyKey(applyKeys: string[], applyKey: string): boolean {
        return false;
    }

    // If a GROUP is present, all COLUMNS terms must correspond to either GROUP keys or to applykeys defined
    // in the APPLY block.
    public existsInGroupApply(groupKeys: string[], applyKeys: string[], columnKey: string): boolean {
        return false;
    }

    // SORT - Any keys provided must be in the COLUMNS.
    public isSortInColumn(columnKeys: string[], sortKey: string): boolean {
        return false;
    }

    public validateApplyToken(key: string, applyToken: string): boolean {
        // CHECK OUT Enum
        return false;
    }

    private validateDir(dir: string): boolean {
        return dir === "UP" || dir === "down";
    }

    public validateKeyStructure(idKey: string, dataSetToQuery: string): boolean {
        let dataSetId: string;
        let dataSetKey: string;
        let keyArrHolder: string[] = idKey.split("_");
        dataSetId = keyArrHolder[0];
        dataSetKey = keyArrHolder[1];

        if (dataSetId === undefined || dataSetKey === undefined) {
            return false;
        }

        if (dataSetId !== dataSetToQuery && dataSetToQuery !== "") {
            return false;
        }
        return true;
    }
}