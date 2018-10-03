import Log from "../Util";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {IDataSet} from "../model/DataSet";
import {ICourseSection} from "../model/CourseSection";
import {ICourse} from "../model/Course";

export default class PerformQuery {
    public dataSets: IDataSet[];
    public dataSetToQuery: IDataSet;

    constructor() {
        Log.trace("Perform Query");
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
                reject(new InsightError("Missing WHERE or OPTIONS clause"));
            }

            this.dataSets = datasets; // update datasets

            this.dataSetToQuery = {
                id: "",
                kind: InsightDatasetKind.Courses,
                numRows: 0,
                courses: []
            }; // clear dataSetToQuery

            try {
                this.handleBody(query.WHERE);
                this.handleOptions(query.OPTIONS);
            } catch (err) {
                reject(err);
            }

        });
    }

    private handleBody(body: any) {
        this.isFilter(Object.entries(body));
    }

    private handleOptions(options: any) {
        // TODO: COME BACK FOR THIS
    }

    // only work with Mcomp right now with a simple case
    private isFilter(filters: Array<[string, any]>) {
        filters.forEach((currValue) => {
            if (this.isMcomp(currValue[0]) && this.validateMcomp(Object.entries(currValue))) {
                return this.executeMcomp(currValue);
            }
        });
    }

    private isLcomp(filter: string): boolean {
        return filter === "AND" || filter === "OR";
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

    private validateMcomp(keyInputs: Array<[string, any]>): boolean {
        if (keyInputs.length === 1 && this.validateKey(keyInputs[0][0], keyInputs[0][1])) {
            return true;
        } else {
            throw new Error("more than one key and inputs in Mcomp");
        }
    }

    private validateKey(key: string, input: any): boolean {
        let dataSetId: string = "";
        let dataSetKey: string = "";
        let keyArrHolder: string[] = key.split("_");
        dataSetId = keyArrHolder[0];
        dataSetKey = keyArrHolder[1];

        if (dataSetId === "" || dataSetKey === "") {
            throw new Error("Invalid key structure");
        }

        return this.isValidKeyInput(dataSetKey, input) && this.isValidId(dataSetId);
    }

    private isValidKeyInput(key: string, input: any): boolean {
        if (key === "dept" && typeof input === "string") {
            return true;
        } else if (key === "id" && typeof input === "string") {
            return true;
        } else if (key === "avg" && typeof input === "number") {
            return true;
        } else if (key === "instructor" && typeof input === "string") {
            return true;
        } else if (key === "title" && typeof input === "string") {
            return true;
        } else if (key === "pass" && typeof input === "number") {
            return true;
        } else if (key === "fail" && typeof input === "number") {
            return true;
        } else if (key === "audit" && typeof input === "number") {
            return true;
        } else if (key === "uuid" && typeof input === "string") {
            return true;
        } else if (key === "year" && typeof input === "number") {
            return true;
        } else {
            throw new Error("Invalid input key/type");
        }
    }

    private isValidId(id: string): boolean {
        this.dataSetToQuery = this.dataSets.find((currValue) => {
            return currValue.id === id;
        });

        return this.dataSetToQuery.id !== "";
    }

    private isInputString(input: string): boolean {
        return false; // stub
    }

    private executeMcomp(keyInput: [string, any]) {
        let key: string = "";
        let input: number = 0;
        let queryResult: ICourseSection[] = []; // TODO: Make a return object
        if (keyInput[0] === "GT") {
            let keyInputHolder = Object.entries(keyInput[1]);
            key = keyInputHolder[0][0];
            input = keyInputHolder[0][1];

            this.dataSetToQuery.courses.forEach((course) => {
                course.sections.forEach((section) => {
                    if (section[key] > input) {
                        // TODO: INCOMPLETE
                        queryResult.push(section);
                    }
                });
            });
            return queryResult;

        } else if (keyInput[0] === "LT") {
            // TODO: COME BACK HERE
        } else {
            // TODO: COME BACK HERE
        }
    }
}
