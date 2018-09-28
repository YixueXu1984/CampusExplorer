import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import ListDatasets from "./ListDatasets";
import AddDataSet from "./AddDataSet";
import {IDataSet} from "../model/DataSet";

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
        // TODO: Implement load datasets
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.dataSets.forEach((dataSet) => {
                if (dataSet.id === id) {
                    return reject(new InsightError("Trying to add an id that already exits"));
                }
            });

            let addDataSet: AddDataSet = new AddDataSet();
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
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let listDataSets: ListDatasets = new ListDatasets();

        listDataSets.listDatasets()
            .then(function (result) {
                return Promise.resolve(result);
            })
            .catch(function (err) {
                return Promise.reject(err);
            });

        return Promise.reject("Not finished implementaiton");
    }
}
