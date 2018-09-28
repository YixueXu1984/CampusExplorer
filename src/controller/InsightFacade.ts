import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import AddDataSet from "./AddDataSet";

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
        let addDataSet: AddDataSet = new AddDataSet();

        // TODO: check if dataSet's id is already in memory
        addDataSet.addDataset(id, content, kind)
            .then(function (result) {
                // TODO: implement this
                // return Promise.resolve(result);
            })
            .catch(function (err) {
                return Promise.reject(new InsightError(err));
            });

        return Promise.reject("Not finished implementaiton");
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
