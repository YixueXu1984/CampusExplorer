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
            if (id === null || id === undefined ) {
                reject(new InsightError("null/ undefined Id"));
            } else if (!this.existDataset(id, dataSets)) {
                reject(new NotFoundError("removing a dataset that DNE"));
            } else  {
                let dataset: any;
                let index: number;
                for (index = 0; index < dataSets.length; index++) {
                    if (dataSets[index].id === id) {
                        fs.unlink(__dirname + "/../data/" + id + ".json", (err) => {
                            if (err) { throw err; }
                            // Log.trace("removed dataset: " + id);
                        });
                        dataSets.splice(index);
                    }
                }
                resolve(id);
                }
        });
        // Return Promise.reject("Not implemented.");
    }
    public existDataset(id: string, datasets: IDataSet[]): boolean {

        let i: number;
        let bool: boolean;
        bool = false;
        for (i = 0; i < datasets.length; i++) {
            if (id === datasets[i].id) {
                bool =  true;
            }
        }
        return bool;
    }
}
