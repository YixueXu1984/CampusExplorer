import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import Log from "../Util";
import {IDataSet} from "../model/DataSet";
import {ICourse} from "../model/Course";
import {ICourseSection} from "../model/CourseSection";

export default class LoadDatasets {
    constructor() {
        Log.trace("Load Datasets");
    }

    public loadDatasets(datasets: IDataSet[]): Promise<IDataSet[]> {
        return new Promise<IDataSet[]>((resolve) => {
            // only resolve, load existing json files to datasets
            // TODO: modify following readfile part
            const path = ".../data/";
            const fs = require("fs");
            let dataset;
            let files = fs.readdirSync(path);
            for (let file in files) {
                let text = fs.readFileSync(file, "utf8");
                // TODO: add courses
                dataset = this.createDataset(this.getId(text), this.getType(text), this.getNumRows(text));
                datasets.push(dataset);
            }
            resolve(datasets);
        });
        // return Promise.reject("Not implemented yet.");
    }

    public createDataset(name: string, type: InsightDatasetKind, num: number) {
        // TODO
        let dataset: IDataSet ;
        dataset.id = name;
        dataset.kind = type;
        dataset.numRows = num;
        return dataset;
    }

    private getId(text: string) {
        // TODO
        return "";
    }

    private getType(text: string) {
        // TODO
        // @ts-ignore
        let kind = new InsightDatasetKind();
        return kind;
    }

    private getNumRows(text: string) {
        // TODO
        return 0;
    }
}
