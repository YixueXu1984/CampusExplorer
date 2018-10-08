import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {IDataSet} from "../model/DataSet";
import Parser from "./Parser";
import Interpreter from "./Interpreter";
import InsightFacade from "./InsightFacade";
import {INode} from "../model/Node";

export default class PerformQuery {
    public dataSets: IDataSet[];
    public dataSetToQuery: IDataSet;

    constructor() {
        // Log.trace("Perform Query");
        this.dataSets = [];
        this.dataSetToQuery = {
            id: "",
            kind: InsightDatasetKind.Courses,
            numRows: 0,
            courses: []
        };
    }

    public performQuery(query: any, dataSets: IDataSet[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (query.WHERE === undefined || query.OPTIONS === undefined) {
                reject("Missing WHERE or OPTIONS clause");
            }

            // TODO: Some logic to load dataSet if it hasnt been around already
            this.dataSets = dataSets; // update datasets

            this.dataSetToQuery = {
                id: "",
                kind: InsightDatasetKind.Courses,
                numRows: 0,
                courses: []
            };

            try {
                let columnsToQuery = this.handleColumns(query.OPTIONS.COLUMNS);

                let promiseArr: Array<Promise<any>> = [this.handleOrder(query.OPTIONS.ORDER, columnsToQuery),
                    this.parseBody(query.WHERE, columnsToQuery),
                    this.findDataSet(this.dataSetToQuery.id, dataSets)];

                Promise.all(promiseArr)
                    .then((interpPrep) => {
                        let order = interpPrep[0];
                        let root = interpPrep[1];
                        let dataSet = interpPrep[2];
                        let result = this.interpretBody(root, dataSet, columnsToQuery);
                        if (order !== "") {
                            this.orderResult(result, order);
                        }
                        if (result.length > 5000) {
                            reject(result);
                        } else {
                            resolve(result);
                        }
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } catch (err) {
                reject(err);
            }

        });
    }

    private parseBody(body: any, columnsToQuery: string[]): Promise<INode> {
        return new Promise<INode>((resolve, reject) => {
            try {
                let parser = new Parser(this.dataSetToQuery.id);
                let root = parser.parseFilters(body, columnsToQuery);
                resolve(root);
            } catch (err) {
                reject(err);
            }
        });
    }

    private interpretBody(root: INode, dataSet: IDataSet, columnsToQuery: string[]): any[] {
        let interpreter = new Interpreter();
        return interpreter.filterCourses(root, dataSet, columnsToQuery);
    }

    private handleColumns(columns: string[]): string[] {
        let columnsToQuery: string[] = [];
        if (columns.length < 1) {
            throw new Error("Need to specify at least one column");
        }

        for (let column of columns) {
            columnsToQuery.push(this.validateColumn(column));
        }
        return columnsToQuery;
    }

    private handleOrder(order: string, columnsToQuery: string[]): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (order === undefined) {
                resolve("");
            } else if (order !== undefined && this.validateOrder(order, columnsToQuery)) {
                resolve(order);
            } else {
                reject(order);
            }
        });
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

        if (this.dataSetToQuery.id === "") {
            this.dataSetToQuery.id = dataSetId; // sets the dataSetId to Query
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

    private validateOrder(order: string, columnsToQuery: string[]): boolean {
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

        let existInColumns = columnsToQuery.find((currKey) => {
            return currKey === dataSetKey;
        });

        if (existInColumns === undefined) {
            throw new Error("key used in order not present in columns");
        }

        return true;
    }

    private orderResult(result: any[], orderBy: string) {
        result.sort((a, b) => {
            if (a[orderBy] < b[orderBy]) {
                return -1;
            } else if (a[orderBy] > b[orderBy]) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    private findDataSet(id: string, dataSets: IDataSet[]): Promise<IDataSet> {
        return new Promise<IDataSet>((resolve, reject) => {
            let FoundDataSet = dataSets.find((dataSet) => {
                return dataSet.id === id;
            });

            if (FoundDataSet !== undefined) {
                resolve(FoundDataSet);
            // } else {
            //     this.loadDataset(id)
            //         .then((dataSetLoaded) => {
            //             dataSets.push(dataSetLoaded);
            //             resolve(dataSetLoaded);
            //         })
            //         .catch((dataSetNotFound) => {
            //             reject(dataSetNotFound);
            //         });
            }
        });
    }

    // private loadDataset(id: string) {
    //     return new Promise<IDataSet>((resolve, reject) => {
    //         try {
    //             const fs = require("fs");
    //             let file = fs.readFile("data/" + id + ".json");
    //             let dataset = JSON.parse(file);
    //             this.dataSets.push(dataset);
    //             resolve(dataset);
    //         } catch (err) {
    //             reject(err);
    //         }
    //     });
    //
    // }
}
