export default class Validator {
    constructor() {
        // validator
    }

    // ---- VALIDATORS START --- //
    public validateColumn(dataSetKey: string): boolean {
        switch (dataSetKey) {
            case "dept":
                return true;
            case "id":
                return true;
            case "instructor":
                return true;
            case "title":
                return true;
            case "uuid":
                return true;
            case "avg":
                return true;
            case "pass":
                return true;
            case "fail":
                return true;
            case "audit":
                return true;
            case "year":
                return true;
            default:
                return false;
        }

    }

    public validateOrder(columnsToQuery: string[], dataSetKey: string): boolean {
        let existInColumns = columnsToQuery.find((currKey) => {
            return currKey === dataSetKey;
        });

        if (existInColumns === undefined) {
            throw new Error("key used in order not present in columns");
        }

        return true;
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
        switch (key) {
            case "avg":
                return true;
            case "pass":
                return true;
            case "fail":
                return true;
            case "audit":
                return true;
            case "year":
                return true;
            default:
                return false;
        }
    }

    public validateScompKey(key: string): boolean {
        switch (key) {
            case "dept":
                return true;
            case "id":
                return true;
            case "instructor":
                return true;
            case "title":
                return true;
            case "uuid":
                return true;
            default:
                return false;
        }
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
}
