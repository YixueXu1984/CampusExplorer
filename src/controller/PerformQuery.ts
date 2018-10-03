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

            try {
                // this.handleOptions(query.OPTIONS);
                this.handleBody(query.WHERE);
            } catch (err) {
                reject(err);
            }

        });
    }

    private handleBody(body: any) {
        // parse filter into a tree, create a root node for WHERE first
        this.root = this.createNode("WHERE", "", "", 0);
        this.parseFilters(Object.keys(body), Object.values(body), 1, this.root.childNodes);
        this.testTreeCreation(this.root);
    }

    // TODO: ALL THE VALIDATION
    private parseFilters(filterNames: string[], filterBody: any[], level: number, nodes: INode[]) {
        let i = 0;
        for (let filterName of filterNames) {
            if (this.isMcomp(filterName)) {
                // validate key, validate filterValue
                let key = Object.keys(filterBody[i]);
                let filterValue = Object.values(filterBody[i]);
                nodes.push(this.createNode(filterName, key[0], filterValue[0], level));
            } else if (this.isScomp(filterName)) {
                // validate key, validate filterValue
                let key = Object.keys(filterBody[i]);
                let filterValue = Object.values(filterBody[i]);
                nodes.push(this.createNode(filterName, key[0], filterValue[0], level));
            } else if (this.isAnd(filterName)) {
                // validate and recurse

                let newNode = this.createNode(filterName, "", "", level);
                nodes.push(newNode);
                for (let filters of filterBody[i]) {
                    this.parseFilters(Object.keys(filters), Object.values(filters), level + 1, newNode.childNodes);
                }
            } else if (this.isOr(filterName)) {
                // validate and recurse
                let newNode = this.createNode(filterName, "", "", level);
                nodes.push(newNode);
                for (let filters of filterBody[i]) {
                    this.parseFilters(Object.keys(filters), Object.values(filters), level + 1, newNode.childNodes);
                }
            } else if (this.isNeg(filterName)) {
                // validate and recurse
                let newNode = this.createNode(filterName, "", "", level);
                nodes.push(newNode);
                let filter = filterBody[i];
                this.parseFilters(Object.keys(filter), Object.values(filter), level + 1, newNode.childNodes);

            } else {
                throw new Error("Invalid filter name");
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
        Log.trace(node.filterName + " " + String(node.level) + " " + node.key +  " " + String(node.filterValue));
        for (let childnode of node.childNodes) {
            this.testTreeCreation(childnode);
        }
    }

    // only work with Mcomp right now with a simple case
    // private isValidFilter(filters: Array<[string, any]>) {
    //     let filteredDataSet;
    //     filters.forEach((currFilter) => {
    //         if (this.isMcomp(currFilter[0])) {
    //             let key = Object.keys(currFilter[1]);
    //             let input = Object.values(currFilter[1]);
    //             if (this.validateMcompKey(key[0]) && this.validateMcompInput(input[0])) {
    //                 let mcompFilter = new McompFilter(currFilter[0], key[0], input[0]);
    //                 filteredDataSet = mcompFilter.filter(this.dataSetToQuery);
    //             } else {
    //                 throw new Error("Invalid key/Input combo");
    //             }
    //         } else if (this.isScomp(currFilter[0])) {
    //             let key = Object.keys(currFilter[1]);
    //             let input = Object.values(currFilter[1]);
    //             if (this.validateScompKey(key[0]) && this.validateScompInput(input[0])) {
    //                 let scompFilter = new ScompFilter(currFilter[0], key[0], input[0]);
    //                 filteredDataSet = scompFilter.filter(this.dataSetToQuery);
    //             } else {
    //                 throw new Error("Invalid key/Input combo");
    //             }
    //         }
    //     });
    //
    //
    // }

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

    // private validateMcompKey(key: string): boolean {
    //     let dataSetId: string;
    //     let dataSetKey: string;
    //     let keyArrHolder: string[] = key.split("_");
    //     dataSetId = keyArrHolder[0];
    //     dataSetKey = keyArrHolder[1];
    //
    //     if (dataSetId === "" || dataSetKey === "") {
    //         throw new Error("Invalid key structure");
    //     }
    //
    //     if (dataSetId !== this.dataSetToQuery.id) {
    //         throw new Error("numerous dataset ids present in query");
    //     }
    //
    //     switch (dataSetKey) {
    //         case "avg":
    //             return true;
    //         case "fail":
    //             return true;
    //         case "audit":
    //             return true;
    //         case "year":
    //             return true;
    //         default:
    //             return false;
    //     }
    // }
    //
    // private validateScompKey(key: string) {
    //     let dataSetId: string;
    //     let dataSetKey: string;
    //     let keyArrHolder: string[] = key.split("_");
    //     dataSetId = keyArrHolder[0];
    //     dataSetKey = keyArrHolder[1];
    //
    //     if (dataSetId === "" || dataSetKey === "") {
    //         throw new Error("Invalid key structure");
    //     }
    //
    //     if (dataSetId !== this.dataSetToQuery.id) {
    //         throw new Error("numerous dataset ids present in query");
    //     }
    //
    //     switch (dataSetKey) {
    //         case "dept":
    //             return true;
    //         case "id":
    //             return true;
    //         case "instructor":
    //             return true;
    //         case "title":
    //             return true;
    //         default:
    //             return false;
    //     }
    // }
    //
    // private validateMcompInput(input: number) {
    //     return typeof input === "number"; // hmm seems redundant lets see lol
    // }
    //
    // private setDataSetToQuery(id: string): void {
    //     this.dataSetToQuery = this.dataSets.find((currValue) => {
    //         return currValue.id === id;
    //     });
    //     if (this.dataSetToQuery.id === "") {
    //         throw new Error("dataSet not found");
    //     }
    // }
    //
    // private handleOptions(options: any) {
    //     if (options.COLUMNS === undefined || options.COLUMNS.length === 0) {
    //         throw new Error("COLUMNS REQUIRED");
    //     } else {
    //         this.parseColumnsToQuery(options.COLUMNS);
    //     }
    // }
    //
    // private parseColumnsToQuery(columns: string[]) {
    //     this.setDataSetToQuery(columns[0]); // sets the dataSet we are querying
    //
    //     for (let column of columns) {
    //         let keyHolder: string[] = column.split("_");
    //         let id = keyHolder[0];
    //         let key = keyHolder[1];
    //
    //         if (id !== this.dataSetToQuery.id) {
    //             throw Error("id mismatched");
    //         } else {
    //             if(this.existKey(key)) {
    //                 this.columnsToQuery.push(key);
    //             }
    //         }
    //     }
    // }
    //
    // private existKey(key: string) {
    //     switch (key) {
    //         case "dept":
    //             return true;
    //         case "id":
    //             return true;
    //         case "instructor":
    //             return true;
    //         case "title":
    //             return true;
    //         case "pass":
    //             return true;
    //         case "fail":
    //             return true;
    //         case "audit":
    //             return true;
    //         case "audit":
    //             return true;
    //         case "year":
    //             return true;
    //     }
    // }
}
