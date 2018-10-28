import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import AddDataSetCourses from "./AddDataSetCourses";
import {IDataSet} from "../model/DataSet";
import RemoveDataset from "./RemoveDataset";
import PerformQuery from "./PerformQuery";
import * as fs from "fs";
import AddDataSetRooms from "./AddDataSetRooms";
import {IDataSetRooms} from "../model/DataSetRooms";
import {IDataSetCourseSections} from "../model/DataSetCourseSections";

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
        this.loadDataSet()
            .then((dataSets) => {
                this.dataSets = dataSets;
            })
            .catch((err) => {
                Log.error("failed to load cached datasets" + String(err));
            });
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.dataSets.forEach((dataSet) => {
                if (dataSet.id === id) {
                    return reject(new InsightError("Trying to add an id that already exits"));
                }
            });
            if (kind === InsightDatasetKind.Courses) {
                let addDataSet: AddDataSetCourses = new AddDataSetCourses();
                let dataSetsId: string[] = [];
                addDataSet.addDataset(id, content, kind)
                    .then((dataSet) => {
                        this.dataSets.push(dataSet);
                        this.dataSets.forEach((currDataSet) => {
                            dataSetsId.push(currDataSet.id);
                        });
                        Log.trace("7777777");
                        resolve(dataSetsId);
                    })
                    .catch((err) => {
                        reject(new InsightError(err));
                    });
            } else if (kind === InsightDatasetKind.Rooms) { // added case for Room
                let addDataSet: AddDataSetRooms = new AddDataSetRooms();
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
            }
        });
    }

    public removeDataset(id: string): Promise<string> {
        let removeDataSet = new RemoveDataset();
        return removeDataSet.removeDataset(id, this.dataSets);
        // return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise<any[]> {
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

    private loadDataSet(): Promise<IDataSet[]> {
        // update to room edition
        // TODO: fix this
        return new Promise<IDataSet[]>((resolve, reject) => {
            fs.access("data/", (err) => {
                if (err) {
                    reject(err);
                    // fs.mkdir("data/", (error) => {
                    //     if (err) {
                    //         reject(error);
                    //     }
                    //     this.readDir()
                    //         .then((dataSets) => {
                    //             return resolve(dataSets);
                    //         })
                    //         .catch((error2) => {
                    //             return reject(error2);
                    //         });
                    //
                    // });
                } else {
                    this.readDir()
                        .then((dataSets) => {
                            return resolve(dataSets);
                        })
                        .catch((error1) => {
                            return reject(error1);
                        });
                }
            });
        });
    }

    private readDir(): Promise<IDataSet[]> {
        return new Promise<IDataSet[]>((resolve, reject) => {
            let dataSets: IDataSet[] = [];
            let promiseArr: Array<Promise<IDataSet>> = [];
            fs.readdir("data/", (err: Error, files: string[]) => {
                if (err) {
                    reject(err);
                }

                for (let file of files) {
                    promiseArr.push(this.readFiles(file));
                }

                Promise.all(promiseArr)
                    .then((dataSetArray) => {
                        dataSetArray.forEach((dataSet) => {
                            dataSets.push(dataSet);
                        });
                        resolve(dataSets);
                    })
                    .catch((error) => {
                        return reject(error);
                    });
            });
        });
    }

    private readFiles(file: string): Promise<IDataSet> {
        return new Promise<IDataSet>((resolve, reject) => {
            fs.readFile(file, "utf8", (err, data) => {
                try {
                    if (err) {
                        throw err;
                    }
                    let dataSet: IDataSet = JSON.parse(data);
                    if (dataSet.kind === InsightDatasetKind.Courses) {
                        resolve(dataSet as IDataSetCourseSections);
                    } else {
                        resolve(dataSet as IDataSetRooms);
                    }
                    resolve(dataSet);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }
}
