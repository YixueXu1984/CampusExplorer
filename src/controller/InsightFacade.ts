import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return Promise.reject("Not implemented.");
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        // 1, Check data structure: text
        // 2. Read datasets' id
        // 3. Read datasets' type
        // 4. Read datasets' number of rows
        // 5. Return fullfilled promises with all the data
        let datasets: InsightDataset[];
        let dataset: InsightDataset;
        const path = "./src/datasets";
        const fs   = require("fs");
        let files = fs.readdirSync(path);

        for (let file in files) {
            // create new datasets and add them to datasets
            // todo
            let text = fs.readFileSync(file, "utf8");
            dataset = this.createDataset(this.getId(text), this.getType(text), this.getNumRows(text));
            datasets.push(dataset);
        }
        return Promise.resolve(datasets);
    }

    public createDataset(name: string, type: InsightDatasetKind, num: number): InsightDataset {
        let dataset: InsightDataset;
        dataset.id      = name;
        dataset.kind    = type;
        dataset.numRows = num;
        return dataset;
    }

    public getId(text: string): string {
        // todo
        let arr = text.split(";");
        arr[1].trim();
        return text.substring(arr[1].indexOf("id"));
    }

    public getType(text: string): InsightDatasetKind {
        // todo
        return null;
    }

    public getNumRows(text: string): number {
        // todo
        return -1;
    }
}
