import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import AddDataSetCourses from "./AddDataSetCourses";
import {IDataSet} from "../model/DataSet";
import RemoveDataset from "./RemoveDataset";
import PerformQuery from "./PerformQuery";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    public dataSets: IDataSet[];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.dataSets = [];
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.dataSets.forEach((dataSet) => {
                if (dataSet.id === id) {
                    return reject(new InsightError("Trying to add an id that already exits"));
                }
            });

            let addDataSet: AddDataSetCourses = new AddDataSetCourses();
            let dataSetsId: string[] = [];
            addDataSet.addDataset(id, content, kind)
                .then((dataSet) => {
                    this.dataSets.push(dataSet);
                    this.dataSets.forEach((currDataSet) => {
                        dataSetsId.push(currDataSet.id);
                    });
                    resolve(dataSetsId);
                })
                .catch((err) => {
                    reject(new InsightError(err));
                });
        });
    }

    public removeDataset(id: string): Promise<string> {
        let removeDataSet = new RemoveDataset();
        return removeDataSet.removeDataset(id, this.dataSets);
        // return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise<any[]> {
        // TODO: add function GROUP
        // TODO: add function APPLY
        // TODO: add function SORT
        return new Promise((resolve, reject) => {
            let performQuery = new PerformQuery();
            performQuery.performQuery(query, this.dataSets)
                .then((result) => {
                    resolve(result);
                })
                .catch((err) => {
                    reject(new InsightError(err));
                });
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let results: InsightDataset[] = [];
        this.dataSets.forEach((currDataSet) => {
            results.push(this.createDataset(currDataSet.id, currDataSet.kind, currDataSet.numRows));
        });
        return Promise.resolve(results);
    }

    public createDataset(name: string, type: InsightDatasetKind, num: number): InsightDataset {
        // TODO: implement Room case
        let dataset: InsightDataset = {
          id: "",
          kind: InsightDatasetKind.Courses,
          numRows: 0
        };
        dataset.id = name;
        dataset.kind = type;
        dataset.numRows = num;
        return dataset;
    }
}
