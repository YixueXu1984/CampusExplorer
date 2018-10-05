import Log from "../Util";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {IDataSet} from "../model/DataSet";
import {ICourseSection} from "../model/CourseSection";
import {ITree} from "../model/Tree";
import {INode} from "../model/Node";

export default class PerformQuery {
    public dataSets: IDataSet[];
    public dataSetToQuery: IDataSet;
    private columnsToQuery: string[];
    private root: INode;
    private result: any[];
    private order: string;

    constructor() {
        Log.trace("Perform Query");
        this.dataSets = [];
        this.dataSetToQuery = {
            id: "",
            kind: InsightDatasetKind.Courses,
            numRows: 0,
            courses: []
        };
        this.columnsToQuery = [];
        this.root = {
            level: 0,
            filterName: "",
            key: "",
            filterValue: "",
            childNodes: []
        };
        this.result = [];
        this.order = "";
    }

    public performQuery(query: any, datasets: IDataSet[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (query.WHERE === undefined || query.OPTIONS === undefined) {
                reject(new InsightError("Missing WHERE or OPTIONS clause"));
            }

            this.dataSets = datasets; // update datasets

            this.dataSetToQuery = {
                id: "",
                kind: InsightDatasetKind.Courses,
                numRows: 0,
                courses: []
            }; // clear dataSetToQuery
            this.columnsToQuery = [];
            this.root = {
                level: 0,
                filterName: "",
                key: "",
                filterValue: "",
                childNodes: []
            };
            this.result = [];
            this.order = "";

            try {
                this.dataSetToQuery = this.dataSets[0];
                this.handleOptions(query.OPTIONS);
                let result = this.handleBody(query.WHERE);
                this.orderResult(result);
                resolve(result);
            } catch (err) {
                reject(err);
            }

        });
    }

    private handleBody(body: any): any[] {
        let result: any[] = [];
        // parse filter into a tree, create a root node for WHERE first
        this.root = this.createNode("WHERE", "", "", 0);
        this.parseFilters(Object.keys(body), Object.values(body), 1, this.root.childNodes);

        this.dataSetToQuery.courses.forEach((section) => {
            if (this.filterCourses(this.root, section)) {
                result.push(this.createResult(section));
            }
        });
        Log.trace(String(result.length));
        return result;

    }

    private handleOptions(options: any) {
        // TODO: should tell us which dataSet to query
        if (options.COLUMNS.length < 1) {
            throw new Error("Need to specify at least one column");
        }

        for (let column of options.COLUMNS) {
            this.columnsToQuery.push(this.validateColumn(column));
        }

        if (options.ORDER !== undefined) {
            this.validateOrder(options.ORDER);
            this.order = options.ORDER;
        }

    }

    // TODO: ALL THE VALIDATION
    private parseFilters(filterNames: string[], filterBody: any[], level: number, nodes: INode[]) {
        let i = 0;
        for (let filterName of filterNames) {
            if (this.isMcomp(filterName)) {
                // validate key, validate filterValue
                let key = this.validateKey(Object.keys(filterBody[i]), filterName);
                let filterValue = this.validateInputValue(Object.values(filterBody[i]), filterName);
                nodes.push(this.createNode(filterName, key, filterValue, level));
            } else if (this.isScomp(filterName)) {
                // validate key, validate filterValue
                let key = this.validateKey(Object.keys(filterBody[i]), filterName);
                let filterValue = this.validateInputValue(Object.values(filterBody[i]), filterName);
                nodes.push(this.createNode(filterName, key, filterValue, level));
            } else if (this.isAnd(filterName) && this.validateLcomp(filterBody[i])) {
                // validate and recurse
                let newNode = this.createNode(filterName, "", "", level);
                nodes.push(newNode);
                for (let filters of filterBody[i]) {
                    this.parseFilters(Object.keys(filters), Object.values(filters), level + 1, newNode.childNodes);
                }
            } else if (this.isOr(filterName) && this.validateLcomp(filterBody[i])) {
                // validate and recurse
                let newNode = this.createNode(filterName, "", "", level);
                nodes.push(newNode);
                for (let filters of filterBody[i]) {
                    this.parseFilters(Object.keys(filters), Object.values(filters), level + 1, newNode.childNodes);
                }
            } else if (this.isNeg(filterName) && this.validateNeg(filterBody[i])) {
                // validate and recurse
                let newNode = this.createNode(filterName, "", "", level);
                nodes.push(newNode);
                let filter = filterBody[i];
                this.parseFilters(Object.keys(filter), Object.values(filter), level + 1, newNode.childNodes);

            } else {
                throw new Error("Invalid filter format");
            }
            i = i + 1;
        }
    }

    private createNode(filterName: string, key: string, filterValue: string | number, level: number): INode {
        let node: INode = {
            level,
            filterName,
            key,
            filterValue,
            childNodes: []
        };
        return node;
    }

    private testTreeCreation(node: INode) {
        Log.trace(node.filterName + " " + String(node.level) + " " + node.key + " " + String(node.filterValue));
        for (let childnode of node.childNodes) {
            this.testTreeCreation(childnode);
        }
    }

    private filterCourses(node: INode, section: ICourseSection): boolean {
        switch (node.filterName) {
            case "WHERE":
                return this.executeWHERE(node, section);
            case "GT":
                return this.executeGT(node.key, node.filterValue, section);
            case "LT":
                return this.executeLT(node.key, node.filterValue, section);
            case "EQ":
                return this.executeEQ(node.key, node.filterValue, section);
            case "IS":
                return this.executeIS(node.key, node.filterValue, section);
            case "AND":
                return this.executeAND(node, section);
            case "OR":
                return this.executeOR(node, section);
            case "NOT":
                return this.executeNOT(node, section);
            default:
                throw new Error("WTF, its not suppose to get here");
        }
    }

    private executeGT(key: string, filterValue: number | string, section: ICourseSection): boolean {
        return section[key] > filterValue;
    }

    private executeLT(key: string, filterValue: number | string, section: ICourseSection): boolean {
        return section[key] < filterValue;
    }

    private executeEQ(key: string, filterValue: number | string, section: ICourseSection): boolean {
        return section[key] === filterValue;
    }

    private executeIS(key: string, filterValue: number | string, section: ICourseSection): boolean {
        return section[key] === filterValue;
    }

    private executeWHERE(node: INode, section: ICourseSection): boolean {
        let allTrue: boolean = true;
        for (let childNode of node.childNodes) {
            if (!this.filterCourses(childNode, section)) {
                allTrue = false;
            }
        }
        return allTrue;
    }

    private executeAND(node: INode, section: ICourseSection): boolean {
        let allTrue: boolean = true;
        for (let childNode of node.childNodes) {
            if (!this.filterCourses(childNode, section)) {
                allTrue = false;
            }
        }
        return allTrue;
    }

    private executeOR(node: INode, section: ICourseSection): boolean {
        let atLeastOneTrue: boolean = false;
        for (let childNode of node.childNodes) {
            if (this.filterCourses(childNode, section)) {
                atLeastOneTrue = true;
            }
        }
        return atLeastOneTrue;
    }

    private executeNOT(node: INode, section: ICourseSection): boolean {
        return !(this.filterCourses(node.childNodes[0], section));
    }

    private createResult(section: ICourseSection): any {
        let result: any = {};
        for (let column of this.columnsToQuery) {
            result[this.dataSetToQuery.id + "_" + column] = section[column];
        }

        return result;
    }

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

        if (dataSetId !== this.dataSetToQuery.id) {
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

    private validateColumn(column: string): string {
        let dataSetId: string;
        let dataSetKey: string;
        let keyArrHolder: string[] = column.split("_");
        dataSetId = keyArrHolder[0];
        dataSetKey = keyArrHolder[1];

        if (dataSetId === undefined || dataSetKey === undefined) {
            throw new Error("Invalid key structure");
        }

        if (dataSetId !== this.dataSetToQuery.id) {
            throw new Error("numerous dataset ids present in query");
        }

        switch (dataSetKey) {
            case "dept":
                return dataSetKey;
            case "id":
                return dataSetKey;
            case "instructor":
                return dataSetKey;
            case "title":
                return dataSetKey;
            case "uuid":
                return dataSetKey;
            case "avg":
                return dataSetKey;
            case "pass":
                return dataSetKey;
            case "fail":
                return dataSetKey;
            case "audit":
                return dataSetKey;
            case "year":
                return dataSetKey;
            default:
                throw new Error("Invalid key in columns");
        }

    }

    private validateOrder(order: string): void {
        let dataSetId: string;
        let dataSetKey: string;
        let keyArrHolder: string[] = order.split("_");
        dataSetId = keyArrHolder[0];
        dataSetKey = keyArrHolder[1];

        if (dataSetId === undefined || dataSetKey === undefined) {
            throw new Error("Invalid key structure");
        }

        if (dataSetId !== this.dataSetToQuery.id) {
            throw new Error("numerous dataset ids present in query");
        }

        let existInColumns = this.columnsToQuery.find((currKey) => {
            return currKey === dataSetKey;
        });

        if (existInColumns === undefined) {
            throw new Error("key used in order not present in columns");
        }
    }

    private orderResult(result: any[]) {
        result.sort((a, b) => {
            if (a[this.order] < b[this.order]) {
                return -1;
            } else if (a[this.order] > b[this.order]) {
                return 1;
            } else {
                return 0;
            }
        });
    }
}
