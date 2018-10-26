import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {IDataSet} from "../model/DataSet";
import Parser from "./Parser";
import Interpreter from "./Interpreter";
import InsightFacade from "./InsightFacade";
import {INode} from "../model/Node";
import Validator from "./Validator";
import {IApplyObject} from "../model/ApplyObject";
import {IColumnObject} from "../model/ColumnObject";
import {ITransformationObject} from "../model/TransformationObject";
import {IOrderObject} from "../model/OrderObject";

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
                let columnsToQuery: IColumnObject = {
                    columnKeys: [],
                    columnApplykeys: [],
                };
                columnsToQuery = this.handleColumns(query.OPTIONS.COLUMNS);

                // TODO: handleOrder
                let promiseArr: Array<Promise<any>> = [this.handleOrder(query.OPTIONS.ORDER, columnsToQuery),
                    this.parseBody(query.WHERE),
                    this.findDataSet(this.dataSetToQuery.id, dataSets)];

                Promise.all(promiseArr)
                    .then((interpPrep) => {
                        let order = interpPrep[0];
                        let root = interpPrep[1];
                        let dataSet = interpPrep[2];
                        let result = this.interpretBody(root, dataSet, columnsToQuery.columnKeys);
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

    private parseBody(body: any): Promise<INode> {
        return new Promise<INode>((resolve, reject) => {
            try {
                let parser = new Parser(this.dataSetToQuery.id);
                let root = parser.parseFilters(body);
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

    private handleColumns(columns: string[]): IColumnObject {
        let columnsToQuery: IColumnObject = {
            columnKeys: [],
            columnApplykeys: []
        };
        if (columns.length < 1) {
            throw new Error("Need to specify at least one column");
        }

        // TODO: this is a very temproray way of setting which dataSet we are querying
        if (this.validator.validateKeyStructure(columns[0], this.dataSetToQuery.id)) {
            this.setDataSetToQuery(columns[0]);
        }

        for (let column of columns) {

            if (column.includes("_")) {
                // a key
                if (this.validator.validateKeyStructure(column, this.dataSetToQuery.id)
                    && this.validator.validateColumnKeys(this.extractKey(column))) {
                    columnsToQuery.columnKeys.push(column);
                } else {
                    throw new Error("failed to validate key in columns");
                }

            } else {
                // an apply key
                if (this.validator.validateApplyKeyStructure(column)) {
                    columnsToQuery.columnApplykeys.push(column);
                } else {
                    throw new Error("failed to validate applyKey in columns");
                }
            }
        }

        return columnsToQuery;
    }

    // TODO: order now needs to extract both a key and a direction
    private handleOrder(order: any, columnsToQuery: IColumnObject): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (order === undefined) {
                resolve(""); // no ordering provided
            }

            let orderObject: IOrderObject = {
                dir: "",
                keys: []
            };

            if (typeof order === "string") {
                orderObject.dir = "UP"; // default is always ascending order i think...
                orderObject.keys.push(order);
            } else {
                orderObject.dir = order.dir;
                orderObject.keys = order.keys;
            }

            if (this.validator.validateOrder(columnsToQuery, orderObject.keys)) {
                resolve(order);
            } else {
                reject("columns in ORDER not in COLUMNS");
            }
        });
    }

    private handleTransformations(transformation: any): Promise<ITransformationObject> {
        // TODO: my man
        return null;
    }

    private handleGroup(groupKeys: string[]): Promise<string> {
        return null;
    }

    private handleApply(applyObject: any[]): Promise<IApplyObject[]> {
        return null;
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

    private applyTransformations(result: any[], applyObjects: IApplyObject[]): any[] {
        // hmm not sure if this is right
        return null;
    }

    private groupBy(result: any[], groupKeys: string[]): void {
        // TODO:
    }

    private applyFunction(reslut: any[], applyObject: IApplyObject): void {
        // TODO:
    }

    private findDataSet(id: string, dataSets: IDataSet[]): Promise<IDataSet> {
        return new Promise<IDataSet>((resolve, reject) => {
            let FoundDataSet = dataSets.find((dataSet) => {
                return dataSet.id === id;
            });

            if (FoundDataSet !== undefined) {
                resolve(FoundDataSet);
            } else {
                reject("The dataset does not exist");
            }
        });
    }

    private extractKey(idKey: string): string {
        let dataSetKey: string;
        let keyArrHolder: string[] = idKey.split("_");
        dataSetKey = keyArrHolder[1];

        return dataSetKey;
    }

    private setDataSetToQuery(column: string) {
        this.dataSetToQuery.id = column.split("_")[0];
    }
}
