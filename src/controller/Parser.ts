import {INode} from "../model/Node";
import Log from "../Util";

export default class Parser {
    private readonly dataSetToQueryId: string;

    constructor(dataSetToQueryId: string) {
        // Log.trace("Parser created");
        this.dataSetToQueryId = dataSetToQueryId;
    }

    public parseFilters(body: any, columnsToQuery: string[]): INode {
        let root = this.createNode("WHERE", "", "");
        this.parseFiltersHelper(Object.keys(body), Object.values(body), root.childNodes);
        return root;
    }

    private parseFiltersHelper(filterNames: string[], filterBody: any[], nodes: INode[]) {
        let i = 0;
        for (let filterName of filterNames) {
            if (this.isMcomp(filterName)) {
                let key = this.validateKey(Object.keys(filterBody[i]), filterName);
                let filterValue = this.validateInputValue(Object.values(filterBody[i]), filterName);
                nodes.push(this.createNode(filterName, key, filterValue));
            } else if (this.isScomp(filterName)) {
                let key = this.validateKey(Object.keys(filterBody[i]), filterName);
                let filterValue = this.validateInputValue(Object.values(filterBody[i]), filterName);
                nodes.push(this.createNode(filterName, key, filterValue));
            } else if (this.isAnd(filterName) && this.validateLcomp(filterBody[i])) {
                let newNode = this.createNode(filterName, "", "");
                nodes.push(newNode);
                for (let filters of filterBody[i]) {
                    this.parseFiltersHelper(Object.keys(filters), Object.values(filters), newNode.childNodes);
                }
            } else if (this.isOr(filterName) && this.validateLcomp(filterBody[i])) {
                let newNode = this.createNode(filterName, "", "");
                nodes.push(newNode);
                for (let filters of filterBody[i]) {
                    this.parseFiltersHelper(Object.keys(filters), Object.values(filters), newNode.childNodes);
                }
            } else if (this.isNeg(filterName) && this.validateNeg(filterBody[i])) {
                let newNode = this.createNode(filterName, "", "");
                nodes.push(newNode);
                let filter = filterBody[i];
                this.parseFiltersHelper(Object.keys(filter), Object.values(filter), newNode.childNodes);

            } else {
                throw new Error("Invalid filter format");
            }
            i = i + 1;
        }

    }

    private createNode(filterName: string, key: string, filterValue: string | number): INode {
        let node: INode = {
            filterName,
            key,
            filterValue,
            childNodes: []
        };
        return node;
    }

    // ---- VALIDATORS START --- //
    private isAnd(filter: string): boolean {
        return filter === "AND";
    }

    private isOr(filter: string): boolean {
        return filter === "OR";
    }

    private isNeg(filter: string): boolean {
        return filter === "NOT";
    }

    private isMcomp(filter: string): boolean {
        return filter === "LT" || filter === "GT" || filter === "EQ";
    }

    private isScomp(filter: string): boolean {
        return filter === "IS";
    }

    private validateKey(keys: string[], filterName: string): string {
        let key: string = "";
        if (keys.length !== 1) {
            throw new Error("multiple key inside filter");
        } else {
            key = keys[0];
        }

        let dataSetId: string;
        let dataSetKey: string;
        let keyArrHolder: string[] = key.split("_");
        dataSetId = keyArrHolder[0];
        dataSetKey = keyArrHolder[1];

        if (dataSetId === undefined || dataSetKey === undefined) {
            throw new Error("Invalid key structure");
        }

        if (dataSetId !== this.dataSetToQueryId) {
            throw new Error("numerous dataset ids present in query");
        }

        if (this.isMcomp(filterName) && this.validateMcompKey(dataSetKey)) {
            return dataSetKey;
        } else if (this.isScomp(filterName) && this.validateScompKey(dataSetKey)) {
            return dataSetKey;
        } else {
            throw new Error("failed to validate Key");
        }
    }

    private validateMcompKey(key: string): boolean {
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

    private validateScompKey(key: string): boolean {
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

    private validateInputValue(inputs: any[], filterName: string): string | number {
        let input: string | number;
        if (inputs.length !== 1) {
            throw new Error("multiple input value for a key");
        }
        input = inputs[0];
        if (this.isMcomp(filterName) && typeof input === "number") {
            return input;
        } else if (this.isScomp(filterName) && typeof  input === "string") {
            return input;
        } else {
            throw new Error("failed to validate input value");
        }
    }

    private validateLcomp(body: any[]): boolean {
        if (body.length >= 1) {
            return true;
        } else {
            return false;
        }
    }

    private validateNeg(body: any[]): boolean {
        if (body.length === 1) {
            return true;
        } else {
            return false;
        }
    }
}
