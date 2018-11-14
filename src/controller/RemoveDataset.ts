import Log from "../Util";
import {InsightError, InsightResponse, NotFoundError} from "./IInsightFacade";
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
                    // {code: 400, body: {error: "null/undefined Id"}});
            } else if (!this.existDataset(id, dataSets)) {
                reject(new NotFoundError("removing a dataset that DNE"));
                    // {code: 404, body: {error: "removing a dataset that DNE"}});
            } else  {
                let index: number;
                for (index = 0; index < dataSets.length; index++) {
                    if (dataSets[index].id === id) {
                        fs.unlink("data/" + id + ".json", (err) => {
                            // if (err) { throw err; }
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
