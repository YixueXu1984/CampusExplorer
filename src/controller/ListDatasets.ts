import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import Log from "../Util";

export default class ListDataSets {

    constructor() {
        Log.trace("List Datasets");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        // 1, Check data structure: text
        // 2. Read datasets' id
        // 3. Read datasets' type
        // 4. Read datasets' number of rows
        // 5. Return fullfilled promises with all the data
        let datasets: InsightDataset[];
        let dataset: InsightDataset;
        const path = ".../data/";g
        const fs   = require("fs");
        let files = fs.readdirSync(path);

        for (let file in files) {
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
        let arr = text.split(";");
        arr[0].trim();
        return text.substring(arr[0].indexOf("id:"));
    }

    public getType(text: string): InsightDatasetKind {
        let arr = text.split(";");
        arr[1].trim();
        let textType = text.substring(arr[1].indexOf("kind:"));
        if (textType === "courses") {
            return InsightDatasetKind.Courses;
        } else if (textType === "rooms") {
            return InsightDatasetKind.Rooms;
        }
    }

    public getNumRows(text: string): number {
        let arr = text.split(";");
        arr[2].trim();
        return parseInt(text.substring(arr[2].indexOf("numRows:")), 10);
    }
}
