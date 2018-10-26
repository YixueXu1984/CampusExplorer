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
            courses: []
        };
        this.validator = new Validator();
    }

    public performQuery(query: any, dataSets: IDataSet[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (query.WHERE === undefined || query.OPTIONS === undefined) {
                reject("Missing WHERE or OPTIONS clause");
            }

            if (Object.keys(query).length > 3) {
                reject("Too many keys in query body");
            }

            if (Object.keys(query).length === 3 && query.TRANSFORMATIONS === undefined) {
                reject("Too many keys in query body");
            }

            this.dataSets = dataSets; // update datasets

            this.dataSetToQuery = {
                id: "",
                kind: InsightDatasetKind.Courses,
                numRows: 0,
                courses: []
            };

            try {

                let columnsToQuery = this.handleColumns(query.OPTIONS.COLUMNS);

                let promiseArr: Array<Promise<any>> = [
                    this.handleOrder(query.OPTIONS.ORDER, columnsToQuery),
                    this.handleTransformations(query.TRANSFORMATIONS, columnsToQuery)];

                Promise.all(promiseArr)
                    .then((interpPrep) => {
                        let order = interpPrep[0];
                        let transformations = interpPrep[1];
                        this.setDataSetToQuery(columnsToQuery, transformations);
                        let dataSet = this.findDataSet(this.dataSetToQuery.id, this.dataSets);
                        let root = this.parseBody(query.WHERE);
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

    private handleColumns(columns: string[]): IColumnObject {
        let columnsToQuery: IColumnObject = {
            columnKeys: [],
            columnApplykeys: []
        };
        if (columns.length < 1) {
            throw new Error("Need to specify at least one column");
        }

        for (let column of columns) {

            if (column.includes("_")) {
                // a key
                if (this.validator.validateKeyStructure(column)
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

            if (this.validator.validateOrder(columnsToQuery, orderObject.keys)
                && this.validator.validateDir(orderObject.dir)) {
                resolve(order);
            } else {
                reject("columns in ORDER not in COLUMNS / direction in correct");
            }
        });
    }

    private handleTransformations(transformation: any, columnsToQuery: IColumnObject): Promise<ITransformationObject> {
        return new Promise<ITransformationObject>((resolve, reject) => {
            let transformationObject: ITransformationObject = {
                groupKeys: [],
                applyObjects: []
            };

            if (transformation === undefined) {
                resolve(transformationObject); // its ok to have no transformation
            }

            if (transformation.GROUP === undefined || transformation.APPlY === undefined) {
                reject("Missing group or apply for transformation");
            }

            let promiseArr: Array<Promise<any>> = [
                this.handleGroup(transformation.GROUP, columnsToQuery),
                this.handleApply(transformation.APPLY, columnsToQuery)];

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

    private handleGroup(transformation: any, columnsToQuery: IColumnObject): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            if (transformation.GROUP === undefined || transformation.GROUP.length === 0) {
                reject("Missing group");
            }
            // groupKey must be a valid key and must all be in columns
            let groupKeys: string[] = transformation.GROUP;
            // let allColumnKeys: string[] = columnsToQuery.columnKeys.concat(columnsToQuery.columnApplykeys);
            let allKeysValid = groupKeys.every((groupKey) => {
                return this.validator.validateKeyStructure(groupKey) &&
                    columnsToQuery.columnKeys.includes(groupKey);
            });

            if (allKeysValid) {
                resolve(groupKeys);
            } else {
                reject("keys in group is invalid structure");
            }
        });
    }

    private handleApply(transformation: any, columnsToQuery: IColumnObject): Promise<IApplyObject[]> {
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
                let allCloumnKeys: string[] = columnsToQuery.columnKeys.concat(columnsToQuery.columnApplykeys);

                if (this.validator.validateApplyKeyStructure(applyKey)
                    && this.validator.validateKeyStructure(key)
                    && this.validator.validateApplyToken(key, applyToken)
                    && allCloumnKeys.includes(applyKey)
                    && allCloumnKeys.includes(key)
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

    private applyFunction(result: any[], applyObject: IApplyObject): void {
        // TODO:
    }

    private setDataSetToQuery(columnsToQuery: IColumnObject, transformations: ITransformationObject): void {
        let transformationKeys = transformations.applyObjects.map((applyObject) => {
            return applyObject.key;
        });
        let allIdKeys = columnsToQuery.columnKeys.concat(transformationKeys);
        this.dataSetToQuery.id = this.extractId(allIdKeys[0]);

        if (!allIdKeys.every((IdKey) => {
            return this.extractId(IdKey) === this.dataSetToQuery.id;
        })) {
            throw new Error("multiple different dataSetId in columns and transform");
        }
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
