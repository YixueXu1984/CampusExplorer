import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import {error} from "util";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import AddDataSet from "./AddDataSet";
import {IDataSet} from "../model/DataSet";
import * as fs from "fs";

export default class RemoveDataset {
    constructor() {
        Log.trace("Remove Datasets");
    }

    public removeDataset(id: string, dataSets: IDataSet[]): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (id === null || id === "" || id === undefined ) {
                reject(InsightError);
            } else if (!this.existDataset(id, dataSets)) {
                reject(NotFoundError);
            } else {
                let dataset: any;
                let index: number;
                for (index = 0; index < dataSets.length; index++) {
                    if (dataset.id === id) {
                        dataSets.splice(index);
                    }
                }
                fs.unlink(__dirname + "/../data/" + id, (err) => {
                    if (err) { throw err; }
                    Log.trace("removed dataset: " + id);
                });
                resolve(id);
                }
        });
        // Return Promise.reject("Not implemented.");
    }
    public existDataset(id: string, datasets: IDataSet[]): boolean {

        let i: any;
        let bool: boolean;
        for (i in datasets) {
            if (id === i.id) {
                bool =  true;
                break;
            } else { bool = false; }
        }
        return bool;
    }
}
