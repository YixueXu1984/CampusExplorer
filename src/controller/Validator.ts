import {InsightDatasetKind} from "./IInsightFacade";
import {APPLY_TOKEN, COLUMN_KEYS, MCOMP_KEYS, SCOMP_KEYS} from "./Enums";
import {IColumnObject} from "../model/ColumnObject";
import {IApplyObject} from "../model/ApplyObject";

export default class Validator {
    constructor() {
        // validator
    }

    // ---- VALIDATORS START --- //
    public validateQuerySize(query: any): boolean {
        let length = Object.keys(query).length;
        if (query.WHERE === undefined || query.OPTIONS === undefined) {
            return false;
        }

        if (Object.keys(query).length > 3) {
            return false;
        }

        if (Object.keys(query).length === 3 && query.TRANSFORMATIONS === undefined) {
            return false;
        }

        return true;
    }

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

    // one or more of any character except underscore.
    public validateApplyKeyStructure(key: string): boolean {
        return key.length !== 0 && !key.includes("_");
    }

    // The applykey in an APPLYRULE should be unique (no two APPLYRULE's should share an applykey with the same name).
    public isUniqueApplyKey(applyObjects: IApplyObject[], applyKey: string): boolean {
        let applyKeys = applyObjects.map((applyObject) => {
            return applyObject.applyKey;
        });
        return applyKeys.includes(applyKey);
    }

    public validateApplyToken(key: string, applyToken: string): boolean {
        if (Object.values(APPLY_TOKEN).includes(applyToken)) {
            switch (applyToken) {
                case "COUNT":
                    return Object.values(MCOMP_KEYS).includes(key) || Object.values(SCOMP_KEYS).includes(key);
                default:
                    return Object.values(MCOMP_KEYS).includes(key);
            }
        }
    }

    public validateDir(dir: string): boolean {
        return dir === "UP" || dir === "down";
    }

    public validateKeyStructure(idKey: string): boolean {
        let dataSetId: string;
        let dataSetKey: string;
        let keyArrHolder: string[] = idKey.split("_");
        dataSetId = keyArrHolder[0];
        dataSetKey = keyArrHolder[1];

        if (dataSetId === undefined || dataSetKey === undefined) {
            return false;
        }
        return true;
    }
}
