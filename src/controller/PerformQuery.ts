import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {IDataSet} from "../model/DataSet";
import Parser from "./Parser";
import Interpreter from "./Interpreter";
import InsightFacade from "./InsightFacade";
import {INode} from "../model/Node";
import Validator from "./Validator";
import {IApplyObject} from "../model/ApplyObject";

export default class PerformQuery {
    public dataSets: IDataSet[];
    public dataSetToQuery: IDataSet;
    private validator: Validator;

    constructor() {
        // Log.trace("Perform Query");
        this.dataSets = [];
        this.dataSetToQuery = {
            id: "",
            kind: InsightDatasetKind.Courses,
            numRows: 0,
            data: []
        };
        this.validator = new Validator();
    }

    public performQuery(query: any, dataSets: IDataSet[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (query.WHERE === undefined || query.OPTIONS === undefined) {
                reject("Missing WHERE or OPTIONS clause");
            }

            this.dataSets = dataSets; // update datasets

            this.dataSetToQuery = {
                id: "",
                kind: InsightDatasetKind.Courses,
                numRows: 0,
                data: []
            };

            try {
                let columnsToQuery = this.handleColumns(query.OPTIONS.COLUMNS);

                // TODO: handleOrder
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
            let dataSetKey = this.extractKey(column);
            if (this.validator.validateColumn(dataSetKey)) {
                columnsToQuery.push(dataSetKey);
            }
        }
        return columnsToQuery;
    }

    // TODO: order now needs to extract both a key and a direction
    private handleOrder(order: string, columnsToQuery: string[]): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (order === undefined) {
                resolve("");
            } else if (order !== undefined && this.validator.validateOrder(columnsToQuery, this.extractKey(order))) {
                resolve(order);
            } else {
                reject(order);
            }
        });
    }

    private handleGroup(groupKeys: string[]): Promise<string> {
        return null;
    }

    private handleApply(applyObject: any[]): Promise<IApplyObject[]> {
        return null;
    }

    private extractKey(columnOrder: string): string {
        let dataSetId: string;
        let dataSetKey: string;
        let keyArrHolder: string[] = columnOrder.split("_");
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
        return dataSetKey;
    }

    // TODO: this needs major change
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

    private applyTransformations(result: any[], applyObjects: IApplyObject[]): void {
        // hmm not sure if this is right
    }

    private findDataSet(id: string, dataSets: IDataSet[]): Promise<IDataSet> {
        return new Promise<IDataSet>((resolve, reject) => {
            let FoundDataSet = dataSets.find((dataSet) => {
                return dataSet.id === id;
            });

            if (FoundDataSet !== undefined) {
                resolve(FoundDataSet);
            }
        });
    }
}
