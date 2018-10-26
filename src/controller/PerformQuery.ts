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
            if (!this.validator.validateQuerySize(query)) {
                reject("Invalid # of keys for query");
            }

            this.dataSets = dataSets; // update datasets

            this.dataSetToQuery = {
                id: "",
                kind: InsightDatasetKind.Courses,
                numRows: 0,
                data: []
            };

            try {

                let promiseArr: Array<Promise<any>> = [
                    this.handleColumns(query.OPTIONS.COLUMNS),
                    this.handleTransformations(query.TRANSFORMATIONS)];

                Promise.all(promiseArr)
                    .then((interpPrep) => {
                        let columnsToQuery: IColumnObject = interpPrep[0];
                        let transformations: ITransformationObject = interpPrep[1];
                        // columnsToQuery = this.finalizeColumnsToQuery(columnsToQuery, transformations);
                        let order: IOrderObject = this.handleOrder(query.OPTIONS.ORDER, columnsToQuery);
                        columnsToQuery = this.setDataSetToQuery(columnsToQuery, transformations);
                        let dataSet: IDataSet = this.findDataSet(this.dataSetToQuery.id, this.dataSets);
                        let root: INode = this.parseBody(query.WHERE);
                        let result = this.interpretBody(root, dataSet, columnsToQuery.columnKeys);
                        if (transformations.groupKeys.length !== 0) {
                            result = this.applyTransformations(result, transformations);
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

    private parseBody(body: any): INode {
        try {
            let parser = new Parser(this.dataSetToQuery.id);
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
                    if (this.validator.validateKeyStructure(column)
                        && this.validator.validateColumnKeys(this.extractKey(column))) {
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

    private finalizeColumnsToQuery(columnsToQuery: IColumnObject, transformations: ITransformationObject): void {
        // validate that every key/applKey in apply and groupBy is actually in columns
        let applyKeysInColumns: boolean = transformations.applyObjects.every((applyObject) => {
            return columnsToQuery.columnApplykeys.includes(applyObject.applyKey);
        });
        // add key into columnsToQuery if it DNE
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
            }

            if (transformation.GROUP === undefined || transformation.APPLY === undefined) {
                reject("Missing group or apply for transformation");
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
            if (transformation.GROUP === undefined || transformation.GROUP.length === 0) {
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
            if (transformation.APPLY === undefined) {
                reject("Missing Apply");
            }
            let transformations: any = transformation.APPLY;

            let applyObjects: IApplyObject[] = [];
            transformations.forEach((parameters: { apply: any }) => {
                let apply = parameters.apply;
                let applyObject: IApplyObject = {
                    applyKey: "",
                    applyToken: "",
                    key: ""
                };

                let applyKey = Object.keys(apply)[0];
                let applyBody = Object.values(apply)[0];
                let applyToken = Object.keys(applyBody)[0];
                let key = Object.values(applyBody)[0];

                if (this.validator.validateApplyKeyStructure(applyKey)
                    && this.validator.validateKeyStructure(key)
                    && this.validator.validateApplyToken(key, applyToken)
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

    private applyTransformations(result: any[], transformations: ITransformationObject): any[] {
        let transformationResult: any[] = result;
        transformationResult = this.groupBy(transformationResult, transformations.groupKeys);
        transformations.applyObjects.forEach((applyObject) => {
            transformationResult = this.applyFunction(transformationResult, applyObject);
        });

        return transformationResult;
    }

    private groupBy(result: any[], groupKeys: string[]): any[] {
        let transformationResult: any[] = result;
        let groups = new Map<string, any[]>();
        result.forEach((data) => {
            let groupName: string = "";
            for (let key of groupKeys) {
                groupName = groupName + String(data[key]);
            }

            if (!groups.has(groupName)) {
                groups.set(groupName, [data]);
            } else {
                groups.get(groupName).push(data);
            }
        });
        return transformationResult;
    }

    private applyFunction(result: any[], applyObject: IApplyObject): any[] {
        switch (applyObject.applyToken) {
            case APPLY_TOKEN.Emax:
                return this.applyMax(result, applyObject);
            case APPLY_TOKEN.Emin:
                return this.applyMin(result, applyObject);
            case APPLY_TOKEN.Ecount:
                return this.applyCount(result, applyObject);
            case APPLY_TOKEN.Esum:
                return this.applySum(result, applyObject);
            case APPLY_TOKEN.Eavg:
                return this.applyAvg(result, applyObject);
            default:
                throw new Error("Something went wrong, should not reach here");
        }

    }

    private applyMax(result: any[], applyObject: IApplyObject): any[] {
        let maxValue: number = 0;
        // find the maxValue of the given key in data
        result.forEach((data) => {
            if (data[applyObject.key] > maxValue) {
                maxValue = data[applyObject.key];
            }
        });

        // create a new column named applyKey with this maxvalue for all data
        result.forEach((data) => {
            data[applyObject.applyKey] = maxValue;
        });
        return result;
    }

    private applyMin(result: any[], applyObject: IApplyObject): any[] {
        let minValue: number = 0;
        // find the maxValue of the given key in data
        result.forEach((data) => {
            if (data[applyObject.key] < minValue) {
                minValue = data[applyObject.key];
            }
        });

        // create a new column named applyKey with this maxvalue for all data
        result.forEach((data) => {
            data[applyObject.applyKey] = minValue;
        });
        return result;
    }

    private applyCount(result: any[], applyObject: IApplyObject): any[] {
        let countValue = 0;
        let countArray: any[];
        result.forEach((data) => {
            countArray.push(data[applyObject.key]);
        });

        // find the number of unique occurrences
        let count = countArray.filter(function (item, pos) {
            return countArray.indexOf(item) === pos;
        });
        countValue = count.length;

        result.forEach((data) => {
            data[applyObject.applyKey] = countValue;
        });
        return result;
    }

    private applySum(result: any[], applyObject: IApplyObject): any[] {
        let sumValue: number = 0;
        result.forEach((data) => {
            sumValue = sumValue + data[applyObject.key];
            }
        );
        result.forEach(( (data) => {
            data[applyObject.applyKey] = sumValue.toFixed(2);
        }));
        return result;
    }

    private applyAvg(result: any[], applyObject: IApplyObject): any[] {
        let sum = new Decimal(0);
        result.forEach((data) => {
            sum = sum.add(data[applyObject.key]);
        });
        let avgValue = sum.toNumber() / result.length;
        result.forEach((data) => {
            data[applyObject.applyKey] = avgValue.toFixed(2);
        });
        return result;
    }

    private setDataSetToQuery(columnsToQuery: IColumnObject, transformations: ITransformationObject): IColumnObject {
        let transformationKeys = transformations.applyObjects.map((applyObject) => {
            return applyObject.key;
        });
        columnsToQuery.columnKeys = columnsToQuery.columnKeys.concat(transformationKeys);
        this.dataSetToQuery.id = this.extractId(columnsToQuery.columnKeys[0]);
        let allKeysSameId: boolean = !columnsToQuery.columnKeys.every((IdKey) => {
            return this.extractId(IdKey) === this.dataSetToQuery.id;
        });

        if (allKeysSameId) {
            throw new Error("multiple different dataSetId in columns and transform");
        }
        return columnsToQuery;
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
