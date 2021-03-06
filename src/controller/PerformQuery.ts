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
import {APPLY_TOKEN} from "./Enums";
import {Decimal} from "decimal.js";
import Transformer from "./Transformer";

export default class PerformQuery {
    public dataSets: IDataSet[];
    public dataSetToQuery: IDataSet;
    private validator: Validator;

    constructor() {
        // Log.trace("Perform Query");
        this.dataSets = [];
        this.validator = new Validator();
    }

    public performQuery(query: any, dataSets: IDataSet[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (!this.validator.validateQuerySize(query)) {
                reject("Invalid # of keys for query");
            }

            this.dataSets = dataSets; // update datasets
            try {

                let promiseArr: Array<Promise<any>> = [
                    this.handleColumns(query.OPTIONS.COLUMNS),
                    this.handleTransformations(query.TRANSFORMATIONS)];

                Promise.all(promiseArr)
                    .then((interpPrep) => {
                        let columnsToQuery: IColumnObject = interpPrep[0];
                        let transformations: ITransformationObject = interpPrep[1];
                        if (transformations.groupKeys.length !== 0) {
                            columnsToQuery = this.finalizeColumnsToQuery(columnsToQuery, transformations);
                        }
                        let order: IOrderObject = this.handleOrder(query.OPTIONS.ORDER, columnsToQuery);
                        let dataSetId = this.setDataSetToQuery(columnsToQuery);
                        let dataSetToQuery: IDataSet = this.findDataSet(dataSetId, this.dataSets);
                        if (!this.validateAllColumnsToQuery(columnsToQuery, dataSetToQuery.kind, dataSetToQuery.id)) {
                            throw new Error("failed to validate all columns to query");
                        }

                        let root: INode = this.parseBody(query.WHERE, dataSetToQuery);
                        let result = this.interpretBody(root, dataSetToQuery, columnsToQuery.columnKeys);
                        if (transformations.groupKeys.length !== 0) {
                            let transformer = new Transformer();
                            result = transformer.applyTransformations(result, transformations);
                        }
                        if (order.keys.length !== 0) {
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

    private parseBody(body: any, dataSetToQuery: IDataSet): INode {
        try {
            let parser = new Parser(dataSetToQuery.id, dataSetToQuery.kind);
            return parser.parseFilters(body);
        } catch (err) {
            throw err;
        }
    }

    private interpretBody(root: INode, dataSet: IDataSet, columnsToQuery: string[]): any[] {
        let interpreter = new Interpreter();
        return interpreter.filterCourses(root, dataSet, columnsToQuery);
    }

    private handleColumns(columns: string[]): Promise<IColumnObject> {
        return new Promise<IColumnObject>((resolve, reject) => {
            let columnsToQuery: IColumnObject = {
                columnKeys: [],
                columnApplykeys: []
            };
            if (columns.length < 1) {
                reject("Need to specify at least one column");
            }

            for (let column of columns) {

                if (column.includes("_")) {
                    // a key
                    if (this.validator.validateKeyStructure(column)) {
                        columnsToQuery.columnKeys.push(column);
                    } else {
                        reject("failed to validate key in columns");
                    }

                } else {
                    // an apply key
                    if (this.validator.validateApplyKeyStructure(column)) {
                        columnsToQuery.columnApplykeys.push(column);
                    } else {
                        reject("failed to validate applyKey in columns");
                    }
                }
            }

            resolve(columnsToQuery);
        });
    }

    private finalizeColumnsToQuery(columnsToQuery: IColumnObject,
                                   transformations: ITransformationObject): IColumnObject {
        // validate that every key/applKey in columns is in apply or groupBy
        let allApplyKeys = transformations.applyObjects.map((applyObject) => {
            return applyObject.applyKey;
        });
        let allKeysInColumn = columnsToQuery.columnKeys.concat(columnsToQuery.columnApplykeys);

        let allKeysInColumnBool = allKeysInColumn.every((key) => {
            return transformations.groupKeys.includes(key) ||
                allApplyKeys.includes(key);

        });

        if (!allKeysInColumnBool) {
            throw new Error("every key/applKey in columns is in apply or groupBy");
        }

        // add key into columnsToQuery if it DNE in columnsToQuery but exists in applyObject
        let applyObjectKeys: string[] = transformations.applyObjects.map((applyObject) => {
            return applyObject.key;
        });

        applyObjectKeys.forEach((key) => {
            if (!columnsToQuery.columnKeys.includes(key)) {
                columnsToQuery.columnKeys.push(key);
            }
        });

        return columnsToQuery;
    }

    private validateAllColumnsToQuery(columnsToQuery: IColumnObject, dataSetType: InsightDatasetKind,
                                      dataSetToQueryId: string): boolean {
        let allKeysSameId: boolean = !columnsToQuery.columnKeys.every((IdKey) => {
            return this.extractId(IdKey) === dataSetToQueryId;
        });

        if (allKeysSameId) {
            throw new Error("multiple different dataSetId in columns and transform");
        }
        return columnsToQuery.columnKeys.every((key) => {
            return this.validator.validateColumnKeys(this.extractKey(key), dataSetType);
        });
    }

    private handleOrder(order: any, columnsToQuery: IColumnObject): IOrderObject {
        let orderObject: IOrderObject = {
            dir: "",
            keys: []
        };

        if (order === undefined) {
            return orderObject; // no ordering provided
        }
        if (typeof order === "string") {
            orderObject.dir = "UP"; // default is always ascending order i think...
            orderObject.keys.push(order);
        } else {
            orderObject.dir = order.dir;
            orderObject.keys = order.keys;
        }

        if (this.validator.validateOrder(columnsToQuery, orderObject.keys)
            && this.validator.validateDir(orderObject.dir)) {
            return (orderObject);
        } else {
            throw new Error("columns in ORDER not in COLUMNS / direction in correct");
        }
    }

    private handleTransformations(transformation: any): Promise<ITransformationObject> {
        return new Promise<ITransformationObject>((resolve, reject) => {
            let transformationObject: ITransformationObject = {
                groupKeys: [],
                applyObjects: []
            };

            if (transformation === undefined) {
                resolve(transformationObject); // its ok to have no transformation
            } else if (transformation === null) {
                reject("transformation is null");
            }
            let promiseArr: Array<Promise<any>> = [
                this.handleGroup(transformation),
                this.handleApply(transformation)];

            Promise.all(promiseArr)
                .then((result) => {

                    transformationObject.groupKeys = result[0];
                    transformationObject.applyObjects = result[1];
                    resolve(transformationObject);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    private handleGroup(transformation: any): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            if (transformation.GROUP === undefined
                || transformation.GROUP === null
                || transformation.GROUP.length === 0) {
                reject("Missing group");
            }
            // groupKey must be a valid key and must all be in columns
            let groupKeys: string[] = transformation.GROUP;
            // let allColumnKeys: string[] = columnsToQuery.columnKeys.concat(columnsToQuery.columnApplykeys);
            let allKeysValid = groupKeys.every((groupKey) => {
                return this.validator.validateKeyStructure(groupKey);
            });

            if (allKeysValid) {
                resolve(groupKeys);
            } else {
                reject("keys in group is invalid structure");
            }
        });
    }

    private handleApply(transformation: any): Promise<IApplyObject[]> {
        return new Promise<IApplyObject[]>((resolve, reject) => {
            if (transformation.APPLY === undefined
                || transformation.APPLY === null) {
                reject("Missing Apply");
            }
            let transformations: any[] = transformation.APPLY;

            let applyObjects: IApplyObject[] = [];
            transformations.forEach((apply) => {
                let applyObject: IApplyObject = {
                    applyKey: "",
                    applyToken: "",
                    key: ""
                };

                let applyKey = Object.keys(apply)[0];
                let applyBody = Object.values(apply)[0];
                if (Object.keys(applyBody).length > 1) {
                    reject("Apply body should only have 1 key");
                }
                let applyToken = Object.keys(applyBody)[0];
                let key = Object.values(applyBody)[0];

                if (this.validator.validateApplyKeyStructure(applyKey)
                    && this.validator.validateKeyStructure(key)
                    && this.validator.validateApplyToken(this.extractKey(key), applyToken)
                    && this.validator.isUniqueApplyKey(applyObjects, applyKey)) {
                    applyObject.applyKey = applyKey;
                    applyObject.applyToken = applyToken;
                    applyObject.key = key;
                    applyObjects.push(applyObject);
                } else {
                    reject("Invalid apply object structure");
                }

            });
            resolve(applyObjects);
        });
    }

    private orderResult(result: any[], orderBy: IOrderObject) {
        let direction: number[] = [];
        if (orderBy.dir === "UP") {
            direction[0] = -1;
            direction[1] = 1;
        } else {
            direction[0] = 1;
            direction[1] = -1;
        }
        result.sort((a, b) => {
            if (a[orderBy.keys[0]] < b[orderBy.keys[0]]) {
                return direction[0];
            } else if (a[orderBy.keys[0]] > b[orderBy.keys[0]]) {
                return direction[1];
            } else {
                return this.breakTie(a, b, orderBy.keys, direction);
            }
        });
    }

    private breakTie(a: any, b: any, keys: string[], direction: number[]): number {
        for (let key of keys) {
            if (a[key] < b[key]) {
                return direction[0];
            } else if (a[key] > b[key]) {
                return direction[1];
            }
        }

        return 0; // none of the keys helped to resolve tie
    }

    private setDataSetToQuery(columnsToQuery: IColumnObject): string {
        return this.extractId(columnsToQuery.columnKeys[0]);
    }

    private findDataSet(id: string, dataSets: IDataSet[]): IDataSet {
        let FoundDataSet = dataSets.find((dataSet) => {
            return dataSet.id === id;
        });

        if (FoundDataSet !== undefined) {
            return FoundDataSet;
        } else {
            throw new Error("The dataset does not exist");
        }
    }

    private extractKey(idKey: string): string {
        let dataSetKey: string;
        let keyArrHolder: string[] = idKey.split("_");
        dataSetKey = keyArrHolder[1];

        return dataSetKey;
    }

    private extractId(idKey: string): string {
        let dataSetId: string;
        let keyArrHolder: string[] = idKey.split("_");
        dataSetId = keyArrHolder[0];

        return dataSetId;
    }

}
