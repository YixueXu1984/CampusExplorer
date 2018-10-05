import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {IDataSet} from "../model/DataSet";
import Parser from "./Parser";
import Interpreter from "./Interpreter";

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

    public performQuery(query: any, datasets: IDataSet[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (query.WHERE === undefined || query.OPTIONS === undefined) {
                reject("Missing WHERE or OPTIONS clause");
            }

            // TODO: Some logic to load dataSet if it hasnt been around already
            this.dataSets = datasets; // update datasets

            this.dataSetToQuery = {
                id: "",
                kind: InsightDatasetKind.Courses,
                numRows: 0,
                courses: []
            };

            try {
                this.dataSetToQuery = this.dataSets[0];
                let columnsToQuery = this.handleColumns(query.OPTIONS.COLUMNS);
                let order = this.handleOrder(query.OPTIONS.ORDER, columnsToQuery);
                let result = this.handleBody(query.WHERE, columnsToQuery);
                if (order !== "") {
                    this.orderResult(result, order);
                }
                resolve(result);
            } catch (err) {
                reject(err);
            }

        });
    }

    private handleBody(body: any, columnsToQuery: string[]): any[] {
        let parser = new Parser(this.dataSetToQuery.id);
        let root = parser.parseFilters(body, columnsToQuery);
        let interpreter = new Interpreter();
        return interpreter.filterCourses(root, this.dataSetToQuery, columnsToQuery);
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

    private handleOrder(order: string, columnsToQuery: string[]): string {
        if (order !== undefined && this.validateOrder(order, columnsToQuery)) {
            return order;
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
}
